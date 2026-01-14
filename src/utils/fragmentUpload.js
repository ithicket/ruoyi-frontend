import CryptoJS from "crypto-js";

/**
 * 生成文件ID
 * @returns {string} 文件ID
 */
export const generateFileId = () => {
    return "file_" + Date.now().toString(36) + Math.random().toString(36).slice(2);
};

/**
 * 将文件转换为分片数据
 * @param {File} file 文件对象
 * @returns {Promise<Array>} 分片数据
 */
export const fileToChunk = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(Array.from(new Uint8Array(e.target.result)));
        };
        reader.onerror = () => reject(new Error("读取文件分片失败"));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * 计算文件块的哈希值
 * @param {Blob} blob 文件块
 * @returns {Promise<string>} SHA-256哈希值
 */
export const calculateHash = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target.result;
                const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
                const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
                resolve(hash);
            } catch (error) {
                reject(new Error("计算哈希值失败: " + error.message));
            }
        };
        reader.onerror = () => reject(new Error("读取文件失败"));
        reader.readAsArrayBuffer(blob);
    });
};

/**
 * 文件分片上传函数
 * @param {Object} file 文件对象
 * @param {Number} limit 单文件最大限制，单位MB
 * @param {Function} innerKeyCb 回调函数，接收内部字段
 * @param {Function} cb 回调函数，接收每个分片的上传信息
 * @property {string} fileId 文件ID
 * @property {Boolean} sharding 是否分片
 * @returns {Promise<void>}
 */
export const uploadFile = async (file, limit = 10, innerKeyCb, cb) => {
    let chunkSize = 1024 * 1024 * limit, sharding = false;
    if ( file.size >= chunkSize ) {  
        sharding = true;   
        chunkSize = 1024 * 1024 * 5;    // 分片大小[目前被限定为5MB，不可更改]
    }

    const fileId = generateFileId();
    const totalChunks = Math.ceil(file.size / chunkSize);
    innerKeyCb &&
    innerKeyCb({
        fileId: fileId,
        fileName: file.name,
        fileType: file.raw.type,
        totalSize: file.size,
        chunkSize: chunkSize,
        totalChunks: totalChunks,
        sharding: sharding,
    });

    try {
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.raw.slice(start, end);

            const chunkData = await fileToChunk(chunk);
            const hash = await calculateHash(chunk); // 使用 SHA-256

            cb &&
                cb({
                    fileId: fileId,
                    fileName: file.name,
                    fileType: file.raw.type,
                    totalSize: file.size,
                    chunkIndex: chunkIndex,
                    totalChunks: totalChunks,
                    chunkData: chunkData,
                    hash: hash,
                });
        }
    } catch (error) {
        throw error;
    }
};
