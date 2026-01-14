import {decode} from "js-base64";
import {ElMessage, ElMessageBox, ElNotification} from "element-plus";
import {getToken} from "@/utils/auth";
import {io} from "socket.io-client";
import useTranslateStore from "@/store/modules/translate";
import useUserStore from "@/store/modules/user";

function generateRandomString(length) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return array.reduce(function (hex, byte) {
        return hex + byte.toString(16).padStart(2, "0");
    }, "");
}

function compressImg(base64, multiple, quality, callback) {
    if (!base64) {
        return;
    }
    const length = base64.length / 1024;
    let newImage = new Image();
    newImage.src = base64;
    newImage.setAttribute("crossOrigin", "Anonymous");
    let imgWidth, imgHeight;
    let w = undefined;
    newImage.onload = function () {
        w = this.width * multiple;
        imgWidth = this.width;
        imgHeight = this.height;
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        if (Math.max(imgWidth, imgHeight) > w) {
            if (imgWidth > imgHeight) {
                canvas.width = w;
                canvas.height = w * (imgHeight / imgWidth);
            } else {
                canvas.height = w;
                canvas.width = w * (imgWidth / imgHeight);
            }
        } else {
            canvas.width = imgWidth;
            canvas.height = imgHeight;
            quality = 0.6;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
        let smallBase64 = canvas.toDataURL("image/jpeg", quality);

        console.log(`压缩前：${length}KB`);
        console.log(`压缩后：${smallBase64.length / 1024} KB`);

        callback(smallBase64);
    };
}

const useWebsocketStore = defineStore("websocket", {
    state: () => ({
        io: "/",
        socket: null,
        fileUploadTasks: {},
        messageCallbackList: [],
        messageResultCallbackList: [],
        switchSandboxMsg:[],
        syncGroupResult: {},
        syncContactResult: {},
        is401: {},
        is403: {},
        connectionState: "disconnected", // 'disconnected' | 'connecting' | 'connected' | 'error'
        connectionPromise: null,
        isInitialized: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 10,   // 最大重连次数
        isReconnecting: false,
        isPageUnloading: false,
        _cleanupPageListeners: null,
        _networkMonitoringInitialized: false,
        // 心跳相关
        heartbeatTimer: null,
        heartbeatInterval: 30000, // 30秒心跳间隔
        heartbeatTimeout: 10000, // 10秒超时
        lastHeartbeatTime: null,
        missedHeartbeats: 0,
        maxMissedHeartbeats: 3, // 最大连续心跳失败次数
        // 网络状态
        networkStatus: {
            isOnline: navigator.onLine,
            lastCheckTime: Date.now(),
            serverReachable: true,
        },
        shouldStopReconnecting: false, // 添加停止重连的标志
    }),
    getters: {
        isConnected: (state) => state.connectionState === "connected",
        isConnecting: (state) => state.connectionState === "connecting",
        hasError: (state) => state.connectionState === "error",
        getNetworkStatus: (state) => ({
            isOnline: state.networkStatus.isOnline,
            serverReachable: state.networkStatus.serverReachable,
            lastCheckTime: state.networkStatus.lastCheckTime,
            connectionState: state.connectionState,
        }),
    },
    actions: {
        // 主要连接入口
        async initIO() {
            // 如果正在连接中，返回现有的 Promise
            if (this.connectionState === "connecting" && this.connectionPromise) {
                return this.connectionPromise;
            }

            // 如果已经连接，直接返回成功
            if (this.connectionState === "connected" && this.isInitialized) {
                return Promise.resolve({
                    success: true,
                    message: "WebSocket 已连接",
                    socketId: this.socket?.id,
                });
            }

            // 创建新连接
            this.connectionPromise = this._createConnection();

            try {
                const result = await this.connectionPromise;
                this.connectionPromise = null; // 连接成功后清空 Promise
                return result;
            } catch (error) {
                this.connectionPromise = null; // 连接失败后清空 Promise
                throw error;
            }
        },

        // 私有方法：创建连接（只处理初始连接）
        _createConnection() {
            return new Promise((resolve, reject) => {
                try {
                    this.connectionState = "connecting";
                    this.isPageUnloading = false;

                    // 验证 Token
                    const token = getToken();
                    if (!token) {
                        const error = "Token 不存在，请重新登录";
                        this.connectionState = "error";
                        ElMessage.error(error);
                        reject({ success: false, error, code: "NO_TOKEN" });
                        return;
                    }

                    // 检查网络状态
                    if (!navigator.onLine) {
                        this.connectionState = "error";
                        reject({
                            success: false,
                            error: "网络连接已断开",
                            code: "NETWORK_OFFLINE",
                            message: "请检查网络连接",
                        });
                        return;
                    }

                    // 清理旧连接
                    this._cleanupConnection();

                    // 初始化网络监听（只初始化一次）
                    if (!this._networkMonitoringInitialized) {
                        this._initNetworkMonitoring();
                        this._networkMonitoringInitialized = true;
                    }

                    // 创建新的 Socket 连接
                    this.socket = io(this.io, {
                        path: "/socket.io",
                        query: { Authorization: "Bearer " + token },
                        transports: ["websocket"],
                        timeout: 20000,
                        forceNew: true,
                        // 配置内置心跳
                        pingTimeout: 60000,
                        pingInterval: 25000,
                    });

                    // 设置页面卸载事件监听
                    this._setupPageUnloadListeners();

                    // 设置连接超时
                    const connectionTimeout = setTimeout(() => {
                        if (this.connectionState === "connecting") {
                            this.connectionState = "error";
                            this._cleanupConnection();
                            reject({
                                success: false,
                                error: "Connection timeout",
                                code: "TIMEOUT",
                                message: "连接超时，请检查网络或稍后重试",
                            });
                        }
                    }, 15000);

                    // 连接成功事件
                    this.socket.on("connect", () => {
                        clearTimeout(connectionTimeout);
                        this.connectionState = "connected";
                        console.log("✅ WebSocket 连接成功，ID:", this.socket.id);

                        // 重置重连相关状态
                        this.reconnectAttempts = 0;
                        this.isReconnecting = false;

                        // 设置业务事件监听器
                        this._setupEventListeners();

                        // 启动心跳检测
                        // this._startHeartbeat();

                        this.isInitialized = true;

                        // 保存连接状态到缓存
                        this._saveConnectionState();

                        resolve({
                            success: true,
                            socketId: this.socket.id,
                            message: "WebSocket 连接成功",
                        });
                    });

                    // 连接错误事件（只处理初始连接失败）
                    this.socket.on("connect_error", (error) => {
                        clearTimeout(connectionTimeout);

                        // 🔥 检查是否应该停止处理 connect_error
                        if (this.shouldStopReconnecting) {
                            console.log("⚠️ 已停止重连，忽略 connect_error 事件");
                            return;
                        }

                        // 只处理初始连接的错误
                        if (this.connectionState === "connecting") {
                            this.connectionState = "error";
                            console.error("❌ 初始连接失败:", error);

                            let errorMessage = "连接失败";
                            if (error.message.includes("timeout")) {
                                errorMessage = "连接超时，请检查网络";
                            } else if (error.message.includes("403")) {
                                errorMessage = "连接被拒绝，请重新登录";
                            } else if (error.message.includes("401")) {
                                errorMessage = "身份验证失败，请重新登录";
                            }

                            reject({
                                success: false,
                                error: error.message,
                                code: error.code || "CONNECTION_ERROR",
                                message: errorMessage,
                            });
                        } else if (this.isReconnecting && this.reconnectAttempts <= this.maxReconnectAttempts) {
                            // 重连过程中的连接失败
                            console.error(`🔄 重连过程中连接失败 (尝试 第${this.reconnectAttempts}次):`, error);
                        }
                    });

                    // 断开连接事件（只处理已连接后的断开）
                    this.socket.on("disconnect", (reason) => {
                        console.log("🔌 WebSocket 断开连接:", reason);
                        this.connectionState = "disconnected";
                        this.isInitialized = false;

                        // 停止心跳检测
                        this._stopHeartbeat();

                        // 如果是页面卸载导致的断开，不进行重连
                        if (this.isPageUnloading) {
                            console.log("📄 页面卸载导致的断开，不进行重连");
                            return;
                        }

                        // 根据断开原因决定是否重连
                        if (this._shouldReconnect(reason)) {
                            console.log("🔄 准备重连...");
                            this._handleReconnection();
                        }
                    });

                    // 监听内置心跳
                    this.socket.on("pong", (latency) => {
                        console.log(`💓 内置心跳正常，延迟: ${latency}ms`);
                        this.lastHeartbeatTime = Date.now();
                        this.missedHeartbeats = 0;
                        this.networkStatus.serverReachable = true;
                    });
                } catch (error) {
                    this.connectionState = "error";
                    console.error("❌ 创建连接时发生错误:", error);
                    reject({
                        success: false,
                        error: error.message,
                        code: "INIT_ERROR",
                        message: "初始化失败",
                    });
                }
            });
        },

        // 判断是否应该重连
        _shouldReconnect(reason) {
            const reconnectReasons = ["io server disconnect", "transport close", "transport error", "ping timeout"];
            return reconnectReasons.includes(reason);
        },

        // 处理重连逻辑
        async _handleReconnection() {
            if (this.isReconnecting || this.isPageUnloading || this.shouldStopReconnecting) {
                console.log("⏭️ 正在重连中、页面卸载中或已停止重连，跳过重连");
                return;
            }

            this.isReconnecting = true;
            this.reconnectAttempts++;

            console.log(`🔄 开始第 ${this.reconnectAttempts} 次重连尝试...`);

            // 显示重连消息
            if (this.reconnectAttempts === 1) {
                ElMessage.warning("连接已断开，正在重连...");
            } else if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                ElMessage.warning(`重连中... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            }

            // 超过最大重连次数
            if (this.reconnectAttempts > this.maxReconnectAttempts) {
                this.isReconnecting = false;
                this.shouldStopReconnecting = true; // 🔥 设置停止标志
                
                // 强制清理连接
                console.log("🧹 重连次数超限，强制清理所有连接");
                this._cleanupConnection();
                this.connectionState = "error";

                try {
                    await ElMessageBox.confirm(
                        "网络连接已断开，重连尝试失败。您可以继续留在该页面，或者重新登录",
                        "连接失败",
                        {
                            confirmButtonText: "重新登录",
                            cancelButtonText: "继续等待",
                            type: "warning",
                            closeOnClickModal: false,
                            closeOnPressEscape: false,
                            distinguishCancelAndClose: true,
                        }
                    );

                    // 用户选择重新登录
                    useUserStore().logOut().then(() => {
                        location.href = "/index";
                    });
                } catch (action) {
                    if (action === "cancel") {
                        console.log("👤 用户选择继续等待，重置重连计数");
                        this.reconnectAttempts = 0;
                        this.shouldStopReconnecting = false; // 🔥 重置停止标志
                        this.isReconnecting = false;

                        // 5秒后重新开始重连
                        setTimeout(() => {
                            this._handleReconnection();
                        }, 5000);
                    }
                }
                return;
            }

            try {
                // 检查网络状态，如果离线则等待恢复
                if (!this.networkStatus.isOnline) {
                    console.log(`🌐 网络离线 (尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts})，等待网络恢复...`);
                    
                    // 网络离线时，等待恢复或超时
                    const networkWaitTimeout = Math.min(10000 + (this.reconnectAttempts * 2000), 30000); // 10-30秒
                    
                    try {
                        await this._waitForNetworkWithTimeout(networkWaitTimeout);
                        console.log("🌐 网络已恢复，继续重连...");
                    } catch (networkError) {
                        console.log(`🌐 等待网络恢复超时 (${networkWaitTimeout}ms)，继续下一次尝试`);
                        this.isReconnecting = false;
                        
                        // 网络超时后，继续重连流程
                        setTimeout(() => {
                            this._handleReconnection();
                        }, 2000);
                        return;
                    }
                }

                // 计算重连延迟（指数退避）
                const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts - 1), 10000);
                console.log(`⏰ 等待 ${delay}ms 后重连...`);

                await new Promise((resolve) => setTimeout(resolve, delay));

                // 再次检查网络状态
                if (!this.networkStatus.isOnline) {
                    throw new Error("网络仍然离线");
                }

                // 尝试重新连接
                await this.initIO();

                console.log("✅ 重连成功");
                ElMessage.success("重连成功");
                this.isReconnecting = false;
            } catch (error) {
                console.error(`❌ 第 ${this.reconnectAttempts} 次重连失败:`, error.message);
                this.isReconnecting = false;

                // 继续下一次重连尝试
                setTimeout(() => {
                    this._handleReconnection();
                }, 2000);
            }
        },

        // 等待网络恢复（带超时）
        async _waitForNetworkWithTimeout(timeout = 10000) {
            if (this.networkStatus.isOnline) {
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                
                const checkNetwork = () => {
                    if (this.isPageUnloading) {
                        reject(new Error("页面卸载"));
                        return;
                    }
                    
                    if (this.networkStatus.isOnline) {
                        resolve();
                        return;
                    }
                    
                    if (Date.now() - startTime >= timeout) {
                        reject(new Error("网络恢复超时"));
                        return;
                    }
                    
                    setTimeout(checkNetwork, 500); // 每500ms检查一次
                };
                
                checkNetwork();
            });
        },

        // 初始化网络状态监听
        // 初始化网络状态监听
        _initNetworkMonitoring() {
            console.log("🌐 初始化网络状态监听...");

            // 网络连接恢复
            const handleOnline = () => {
                console.log("🌐 网络已连接");
                this.networkStatus.isOnline = true;
                // 网络恢复时立即检查一次
                this._checkServerConnectivity();

                // 如果当前未连接且不在重连中，尝试恢复连接
                if (!this.isConnected && !this.isReconnecting && this.reconnectAttempts <= this.maxReconnectAttempts) {
                    const savedState = this._getConnectionStateFromCache();
                    if (savedState && savedState.wasConnected) {
                        console.log("🔄 网络恢复，尝试重新连接...");
                        this.initIO();
                    }
                }
            };

            // 网络断开
            const handleOffline = () => {
                console.log("🌐 网络已断开");
                this.networkStatus.isOnline = false;
                this.networkStatus.serverReachable = false;
            };

            // 注册事件监听
            window.addEventListener("online", handleOnline);
            window.addEventListener("offline", handleOffline);

            // 🔥 优化：10分钟检查一次服务器连通性
            this._connectivityInterval = setInterval(() => {
                if (this.networkStatus.isOnline && !this.isPageUnloading) {
                    this._checkServerConnectivity();
                }
            }, 10 * 60 * 1000); // 10分钟检查一次

            // 保存事件清理函数
            this._cleanupNetworkListeners = () => {
                window.removeEventListener("online", handleOnline);
                window.removeEventListener("offline", handleOffline);
                if (this._connectivityInterval) {
                    clearInterval(this._connectivityInterval);
                    this._connectivityInterval = null;
                }
            };
        },

        // 检查服务器连通性
        async _checkServerConnectivity() {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                await fetch(window.location.origin, {
                    method: "HEAD",
                    cache: "no-cache",
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);
                this.networkStatus.serverReachable = true;
                this.networkStatus.lastCheckTime = Date.now();
                return true;
            } catch (error) {
                console.log("🌐 服务器连通性检查失败:", error);
                this.networkStatus.serverReachable = false;
                this.networkStatus.lastCheckTime = Date.now();
                return false;
            }
        },

        // 启动心跳检测
        _startHeartbeat() {
            this._stopHeartbeat(); // 先停止之前的心跳

            console.log("💓 启动心跳检测...");
            this.heartbeatTimer = setInterval(() => {
                this._sendHeartbeat();
            }, this.heartbeatInterval);
        },

        // 停止心跳检测
        _stopHeartbeat() {
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
                console.log("💓 停止心跳检测");
            }
        },

        // 发送心跳
        _sendHeartbeat() {
            if (!this.socket || !this.socket.connected) {
                console.warn("💓 连接已断开，停止心跳检测");
                this._stopHeartbeat();
                return;
            }

            const heartbeatData = {
                timestamp: Date.now(),
                type: "heartbeat",
            };

            console.log("💓 发送心跳检测...");

            const timeoutId = setTimeout(() => {
                this.missedHeartbeats++;
                console.warn(`💓 心跳超时 (${this.missedHeartbeats}/${this.maxMissedHeartbeats})`);

                if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
                    console.error("💓 心跳检测失败次数过多，判断连接已断开");
                    this._handleHeartbeatFailure();
                }
            }, this.heartbeatTimeout);

            this.socket.emit("heartbeat", heartbeatData, (response) => {
                clearTimeout(timeoutId);

                if (response && response.success) {
                    this.lastHeartbeatTime = Date.now();
                    this.missedHeartbeats = 0;
                    console.log("💓 心跳检测成功");
                } else {
                    this.missedHeartbeats++;
                    console.warn("💓 心跳响应异常:", response);
                }
            });
        },

        // 处理心跳失败
        _handleHeartbeatFailure() {
            console.error("💓 心跳检测失败，开始重连...");
            this._stopHeartbeat();
            this.connectionState = "error";

            // 获取当前连接状态并重连
            const savedState = this._getConnectionStateFromCache();
            if (savedState && savedState.wasConnected && !this.isPageUnloading) {
                this._handleReconnection();
            }
        },

        // 设置页面卸载事件监听
        _setupPageUnloadListeners() {
            if (this._cleanupPageListeners) {
                this._cleanupPageListeners();
            }

            const handleBeforeUnload = (event) => {
                console.log("📄 页面即将卸载，保存连接状态并断开WebSocket");
                this.isPageUnloading = true;

                this._saveConnectionState();

                if (this.socket && this.socket.connected) {
                    this.socket.disconnect();
                }

                // 以下代码不写，该函数不会被调用
                event.preventDefault();
                event.returnValue = "是否确认离开？您可能有未保存的内容。"; // 现代浏览器可能忽略具体文案，仅显示默认提示
                return "是否确认离开？您可能有未保存的内容。";
            };

            const handleUnload = () => {
                this.isPageUnloading = true;
                if (this.socket && this.socket.connected) {
                    this.socket.disconnect();
                }
            };

            window.addEventListener("beforeunload", handleBeforeUnload);
            window.addEventListener("unload", handleUnload);

            this._cleanupPageListeners = () => {
                window.removeEventListener("beforeunload", handleBeforeUnload);
                window.removeEventListener("unload", handleUnload);
            };
        },

        // 保存连接状态
        _saveConnectionState() {
            if (this.socket && this.connectionState === "connected") {
                const connectionInfo = {
                    timestamp: Date.now(),
                    wasConnected: true,
                    socketId: this.socket.id,
                };

                sessionStorage.setItem("websocket_state", JSON.stringify(connectionInfo));
            }
        },

        // 从缓存获取连接状态
        _getConnectionStateFromCache() {
            try {
                const savedState = sessionStorage.getItem("websocket_state");
                if (!savedState) return null;

                const connectionInfo = JSON.parse(savedState);
                const timeDiff = Date.now() - connectionInfo.timestamp;

                // 如果保存的状态在10分钟内，认为是有效的
                if (timeDiff < 10 * 60 * 1000 && connectionInfo.wasConnected) {
                    return connectionInfo;
                }

                sessionStorage.removeItem("websocket_state");
                return null;
            } catch (error) {
                console.error("📄 解析连接状态失败:", error);
                sessionStorage.removeItem("websocket_state");
                return null;
            }
        },

        // 恢复连接状态
        async restoreConnectionState() {
            try {
                const savedState = this._getConnectionStateFromCache();
                if (!savedState) {
                    console.log("📄 没有找到保存的连接状态");
                    return false;
                }

                console.log("📄 检测到之前的连接状态，尝试恢复连接:", savedState);

                if (savedState.wasConnected) {
                    await this.initIO();
                    console.log("📄 连接状态恢复成功");
                    return true;
                }

                return false;
            } catch (error) {
                console.error("📄 恢复连接状态失败:", error);
                sessionStorage.removeItem("websocket_state");
                return false;
            }
        },

        // 设置业务事件监听器
        _setupEventListeners() {
            if (!this.socket) return;

            // console.log("🎧 设置业务事件监听器...");

            // 文件上传进度
            this.socket.on("file_progress", (data) => {
                console.log("📁 file_progress", data);
            });

            // 文件上传完成
            this.socket.on("file_complete", (data) => {
                console.log("📁 file_complete", data);
                delete this.fileUploadTasks[data.data];
            });

            // 接收消息
            this.socket.on("send_message", async (res) => {
                await this._handleMessageCallback(res);
            });

            // 消息发送结果回调
            this.socket.on("message_result_callback", async (res) => {
                await this._handleMessageResultCallback(res);
            });

            // 回调-切换设备分身
            this.socket.on("switch_sandbox", async (res) => {
                await this._handleSwitchSandbox(res);
            });

            this.socket.on("sync_account_group", async (res) => {
                await this._handleSyncGroup(res);
            });


            this.socket.on("sync_account_contact", async (res) => {
                await this._handleSyncContact(res);
            });

            this.socket.on("common_callback", async (res) => {
                await this._commonCallback(res);
            });

            // 系统消息
            this.socket.on("ElMessage", (res) => {
                ElMessage[res["type"]](res["content"]);
            });

            // 系统通知
            this.socket.on("Notification", (res) => {
                ElNotification({
                    title: "通知",
                    message: res["content"],
                    type: res["type"],
                });
            });

            // 服务端心跳响应
            this.socket.on("heartbeat_response", (data) => {
                this.lastHeartbeatTime = Date.now();
                this.missedHeartbeats = 0;
                console.log("💓 收到服务端心跳响应:", data);
            });

            // 服务端主动心跳
            this.socket.on("server_heartbeat", (data) => {
                console.log("💓 收到服务端心跳");
                this.socket.emit("heartbeat_response", {
                    timestamp: Date.now(),
                });
            });
        },

        // 等待连接就绪
        async waitForConnection(timeout = 30000) {
            if (this.connectionState === "connected" && this.isInitialized) {
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                const startTime = Date.now();

                const checkConnection = () => {
                    if (this.connectionState === "connected" && this.isInitialized) {
                        resolve();
                    } else if (this.connectionState === "error") {
                        reject(new Error("连接失败"));
                    } else if (Date.now() - startTime >= timeout) {
                        reject(new Error("等待连接超时"));
                    } else {
                        setTimeout(checkConnection, 100);
                    }
                };

                checkConnection();
            });
        },

        // 确保连接可用
        async ensureConnection() {
            if (this.connectionState === "connected" && this.isInitialized) {
                return true;
            }

            try {
                await this.initIO();
                await this.waitForConnection();
                return true;
            } catch (error) {
                console.error("🔌 确保连接失败:", error);
                throw error;
            }
        },

        // 安全发送消息
        async safeSend(eventName, data, options = {}) {
            const { timeout = 30000, retries = 1 } = options;

            // 预检查网络状态
            if (!this.networkStatus.isOnline) {
                throw new Error("网络连接已断开，请检查网络设置");
            }

            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    if (!this.checkConnection()) {
                        await this.ensureConnection();
                    }

                    return await new Promise((resolve, reject) => {
                        const timeoutId = setTimeout(async () => {
                            // 详细的超时原因分析
                            let errorMessage = "请求超时";

                            if (!navigator.onLine) {
                                errorMessage = "网络连接已断开，请检查网络设置";
                            } else {
                                try {
                                    const serverReachable = await this._checkServerConnectivity();
                                    if (!serverReachable) {
                                        errorMessage = "无法连接到服务器，请检查网络或稍后重试";
                                    } else {
                                        errorMessage = "请求超时，服务器响应缓慢，请稍后重试";
                                    }
                                } catch {
                                    errorMessage = "网络连接异常，请检查网络设置";
                                }
                            }
                            ElMessage.error(errorMessage);
                            reject(new Error(errorMessage));
                        }, timeout);

                        this.socket.emit(eventName, data, (res) => {
                            clearTimeout(timeoutId);
                            if (!res) {
                                reject(new Error("服务器无响应"));
                            } else {
                                resolve(res);
                            }
                        });
                    });
                } catch (error) {
                    console.error(`📤 发送事件 ${eventName} 失败 (尝试 ${attempt + 1}/${retries + 1}):`, error);

                    if (attempt === retries) {
                        throw error;
                    }

                    // 在重试前检查网络状态
                    if (!this.networkStatus.isOnline) {
                        throw new Error("网络连接已断开，停止重试");
                    }

                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }
        },

        // 业务方法
        async login(ids) {
            try {
                const res = await this.safeSend("login", { ids });
                console.log("👤 login-res", res);
                return res;
            } catch (error) {
                console.error("👤 登录失败:", error);
                throw error;
            }
        },

        async logout(ids) {
            try {
                const res = await this.safeSend("logout", { ids });
                console.log("👤 logout-res", res);
                return res;
            } catch (error) {
                console.error("👤 登出失败:", error);
                throw error;
            }
        },

        // 消息处理方法
        async _handleMessageCallback(data) {
            this.messageCallbackList = data ?? [];
        },

        async _handleMessageResultCallback(data) {
            this.messageResultCallbackList = data ?? [];
        },

        // 消息处理方法
        async _handleSwitchSandbox(data) {
            this.switchSandboxMsg = data ?? [];
        },

        async _handleSyncGroup(data) {
            this.syncGroupResult = data ?? {};
        },

        async _handleSyncContact(data) {
            this.syncContactResult = data ?? {};
        },

        async _commonCallback(data) {
            console.log("📨 Common callback:", data);
            this.commonMsg = data ?? [];
        },

        // 发送通话
        sendCall(from, to, id) {
            const message = {
                account: from,
                fansAccount: to,
                msgFormatType: "call",
                msgContent: "call",
                msgTranslate: "",
                fansId: id,
            };

            this.socket?.volatile.emit("chat", message, (res) => {
                console.log("📞 send call-res", res);
                if (res.code !== 200) {
                    ElMessage({ message: res.msg, grouping: true, type: "error" });
                    return;
                }
                ElMessage.success("已拨出" + to);
            });
        },

        // 发送头像
        sendHead(from, buf) {
            compressImg(buf, 1, 0.1, (base64) => {
                const post = {
                    account: from,
                    avatar: base64,
                };

                this.socket?.volatile.emit("set_headimage", post, (res) => {
                    if (res.code !== 200) {
                        ElMessage({ message: res.msg, grouping: true, type: "error" });
                        return;
                    }
                });
            });
        },

        // 更新账号状态
        updateAccountStatus(data) {
            // this.socket.volatile.emit("updateAccountStatus", data);
        },

        // 更新文件上传
        updateFileUpload(fileKey) {
            this.fileUploadTasks[fileKey] = true;
        },

        // 翻译接收的消息
        async translateRECV(data) {
            if (useTranslateStore().sett.dst.type && useTranslateStore().translate_user_setting) {
                data.msgTranslate = await useTranslateStore().translate(decode(data?.msgContent), "dst");
            }
            return data;
        },

        // 清理连接
        _cleanupConnection() {
            if (this.socket) {
                this.socket.removeAllListeners();
                this.socket.disconnect();
                this.socket = null;
            }
            this.isInitialized = false;
            this._stopHeartbeat();
        },

        // 检查连接状态
        checkConnection() {
            if (!this.socket || !this.socket.connected || this.connectionState !== "connected") {
                return false;
            }

            // 检查心跳状态
            if (this.lastHeartbeatTime) {
                const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeatTime;
                const maxAllowedTime = this.heartbeatInterval * 2;

                if (timeSinceLastHeartbeat > maxAllowedTime) {
                    console.warn("💓 心跳检测超时，可能连接异常");
                    return false;
                }
            }

            return true;
        },

        // 清理所有状态
        cleanup() {
            console.log("🧹 开始清理WebSocket状态...");
            this.isPageUnloading = true;
            this.shouldStopReconnecting = true; // 🔥 设置停止标志

            // 清理页面事件监听器
            if (this._cleanupPageListeners) {
                this._cleanupPageListeners();
                this._cleanupPageListeners = null;
            }

            // 清理网络监听器
            if (this._cleanupNetworkListeners) {
                this._cleanupNetworkListeners();
                this._cleanupNetworkListeners = null;
            }

            // 停止心跳
            this._stopHeartbeat();

            // 清理连接
            this._cleanupConnection();
            this.connectionState = "disconnected";
            this.connectionPromise = null;

            // 重置重连相关状态
            this.reconnectAttempts = 0;
            this.isReconnecting = false;
            this._networkMonitoringInitialized = false;

            // 清理状态
            this.is401 = {};
            this.is403 = {};

            console.log("🧹 WebSocket状态清理完成");
        },
    },
});

export default useWebsocketStore;