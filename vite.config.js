import { defineConfig, loadEnv } from "vite";
import path from "path";
import createVitePlugins from "./vite/plugins";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

const baseUrl = "http://127.0.0.1:10086";   // 后端接口

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, process.cwd());
    const { VITE_APP_ENV } = env;
    return {
        base: VITE_APP_ENV === "production" ? "/" : "/",
        plugins: createVitePlugins(env, command === "build"),
        resolve: {
            alias: {
                "~": path.resolve(__dirname, "./"),
                "@": path.resolve(__dirname, "./src"),
            },
            extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
        },
        css: {
            // CSS 预处理器配置
            preprocessorOptions: {
                scss: {
                    api: "modern-compiler", // 使用现代编译器 API
                    // 全局样式变量
                    // additionalData: `@use "@/styles/variables.scss" as *;`
                },
            },
            // PostCSS 配置
            postcss: {
                plugins: [
                    // 自动添加浏览器前缀
                    autoprefixer(),
                    // 只在生产环境启用 CSS 压缩
                    ...(command === "build"
                        ? [
                              cssnano({
                                  preset: [
                                      "default",
                                      {
                                          calc: true,
                                          colormin: true,
                                          discardComments: { removeAll: true },
                                      },
                                  ],
                              }),
                          ]
                        : []),
                    {
                        postcssPlugin: "internal:charset-removal",
                        AtRule: {
                            charset: (atRule) => {
                                if (atRule.name === "charset") {
                                    atRule.remove();
                                }
                            },
                        },
                    },
                ],
            },
            // 开启 CSS 代码分割
            codeSplit: true,
            // CSS 模块化配置
            modules: {
                // 生成稳定的类名
                generateScopedName: "[name]__[local]___[hash:base64:5]",
            },
        },
        // 打包配置
        build: {
            sourcemap: command === "build" ? false : "inline",
            outDir: "dist",
            assetsDir: "assets",
            chunkSizeWarningLimit: 2000,
            // 启用 brotli 压缩
            brotliSize: true,
            // 使用 esbuild 进行多线程编译
            minify: "esbuild",
            // CSS 压缩配置
            cssCodeSplit: true,
            // 启用 terser 压缩选项
            terserOptions: {
              compress: {
                drop_console: true, // 删除所有 console 语句
                drop_debugger: true, // 删除 debugger
                pure_funcs: ['console.log'] // 仅删除 console.log（保留其他 console 方法）
              }
            },
            rollupOptions: {
                // 使用多个 worker 进行并行构建
                maxParallelFileOps: 8,
                output: {
                    chunkFileNames: "static/js/[name]-[hash].js",
                    entryFileNames: "static/js/[name]-[hash].js",
                    assetFileNames: "static/[ext]/[name]-[hash].[ext]",
                    // CSS 文件分离
                    manualChunks: {
                        vendor: ["vue", "vue-router"],
                        elementPlus: ["element-plus"]
                    },
                },
            },
        },
        // 优化依赖预构建
        optimizeDeps: {
            include: [
                "vue",
                "vue-router",
                "element-plus",
                "@element-plus/icons-vue",
                "lodash-es",
                "axios",
                "@vueuse/core",
                "pinia",
                "pinia-plugin-persistedstate",
                "socket.io-client",
                "js-cookie",
                "crypto-js",
            ],
            esbuildOptions: {
              target: 'es2020'  // 预构建的依赖将被编译为 ES2020 兼容代码
            }
        },
        // vite 相关配置
        server: {
            port: 80,
            host: true,
            open: true,
            // warmup: {    // 预构建预热  暂无需启用
            //     clientFiles: [
            //         // 预构建 src/components 目录下的所有组件  支持 glob 模式匹配，** 表示递归匹配所有子目录
            //         './src/components/**/*.vue',
            //         './src/components/**/*.jsx', // 如果使用 JSX 组件
            //         './src/components/**/*.tsx'  // 如果使用 TypeScript JSX
            //     ]
            // },
            proxy: {
                // https://cn.vitejs.dev/config/#server-proxy
                "/dev-api": {
                    target: baseUrl,
                    changeOrigin: true,
                    rewrite: (p) => p.replace(/^\/dev-api/, ""),
                },
                // springdoc proxy
                "^/v3/api-docs/(.*)": {
                    target: baseUrl,
                    changeOrigin: true,
                },
            },
        },
    };
});
