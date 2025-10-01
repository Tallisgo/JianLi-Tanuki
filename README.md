# JianLi Tanuki (简狸) 🦝

> **Cute help, smart hire.**  

## 📖 项目简介

JianLi Tanuki 是一个智能简历解析系统，通过 AI 技术帮助 HR 快速、准确地解析和提取简历信息。系统采用现代化的前后端分离架构，提供直观的用户界面和强大的后端处理能力。

## ✨ 主要功能

- 📄 **多格式支持**：支持 PDF、Word、图片等多种简历格式
- 🤖 **智能解析**：基于 AI 的简历信息提取，包括基本信息、工作经历、教育背景等
- 👀 **实时预览**：上传后即可预览简历内容和解析结果
- 📊 **结构化展示**：将简历信息结构化展示，便于快速浏览
- 🔄 **批量处理**：支持多文件同时上传和处理

## 🏗️ 技术架构

### 前端 (Frontend)
- **React 18** + **TypeScript**
- **Ant Design** - UI 组件库
- **Vite** - 构建工具
- **Axios** - HTTP 客户端

### 后端 (Backend)
- **Python 3.9+**
- **FastAPI** - 现代、快速的 Web 框架
- **SQLite** - 轻量级数据库
- **异步处理** - 支持大文件上传和长时间解析任务

## 🚀 快速开始

### 环境要求
- Node.js 16+
- Python 3.9+
- Git

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/Tallisgo/JianLi-Tanuki.git
   cd JianLi-Tanuki
   ```

2. **启动后端服务**
   ```bash
   cd backend
   pip install -r requirements.txt
   python start.py
   ```
   后端服务将在 `http://localhost:8001` 启动

3. **启动前端服务**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   前端服务将在 `http://localhost:5173` 启动

4. **访问应用**
   打开浏览器访问 `http://localhost:5173`

## 📁 项目结构

```
JianLi-Tanuki/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── uploads/            # 上传文件存储
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── pages/          # 页面组件
│   │   └── services/       # API 服务
│   └── package.json        # Node.js 依赖
└── README.md              # 项目说明
```

## 🎯 使用指南

1. **上传简历**：拖拽或点击上传简历文件
2. **查看预览**：系统自动显示文件预览
3. **等待解析**：AI 自动解析简历内容
4. **查看结果**：结构化展示解析后的信息
5. **下载文件**：可下载原始文件或解析结果

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目链接：[https://github.com/Tallisgo/JianLi-Tanuki](https://github.com/Tallisgo/JianLi-Tanuki)
- 问题反馈：[Issues](https://github.com/Tallisgo/JianLi-Tanuki/issues)

---

<div align="center">
  <p>Made with ❤️ by Tallisgo</p>
  <p>🦝 Cute help, smart hire 🦝</p>
</div>