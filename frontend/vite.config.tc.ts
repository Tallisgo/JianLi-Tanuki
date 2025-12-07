import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 腾讯云部署配置
export default defineConfig({
    plugins: [react()],

    // 服务器配置
    server: {
        // 监听所有网络接口，允许外部访问
        host: '0.0.0.0',
        // 端口配置
        port: 5173,
        // 是否自动打开浏览器
        open: false,
        // 允许外部访问
        strictPort: true,
        // 代理配置（如果需要）
        proxy: {
            // 代理API请求到后端
            '/api': {
                target: 'http://localhost:8001',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, '/api/v1')
            }
        }
    },

    // 构建配置
    build: {
        // 输出目录
        outDir: 'dist',
        // 静态资源目录
        assetsDir: 'assets',
        // 生成source map
        sourcemap: false,
        // 压缩配置
        minify: 'terser',
        // 构建后清空输出目录
        emptyOutDir: true,
        // 分包配置
        rollupOptions: {
            output: {
                // 分包策略
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    antd: ['antd'],
                    router: ['react-router-dom']
                }
            }
        }
    },

    // 环境变量配置
    define: {
        // 定义全局常量
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    },

    // 路径别名
    resolve: {
        alias: {
            '@': '/src',
            '@components': '/src/components',
            '@pages': '/src/pages',
            '@services': '/src/services',
            '@utils': '/src/utils'
        }
    },

    // CSS配置
    css: {
        // CSS预处理器
        preprocessorOptions: {
            less: {
                // 全局变量
                additionalData: `@import "@/styles/variables.less";`
            }
        }
    },

    // 优化配置
    optimizeDeps: {
        // 预构建依赖
        include: [
            'react',
            'react-dom',
            'antd',
            'react-router-dom'
        ]
    }
})
