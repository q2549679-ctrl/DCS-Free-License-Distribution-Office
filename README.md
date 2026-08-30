## 🚀 快速上手

### 1. 环境准备
* **Node.js** >= 18.0.0 (推荐 LTS 版本)
* 包管理工具：`npm` / `yarn` / `pnpm`

### 2. 获取代码与安装依赖
```bash
# 进入项目目录
cd dcs-trial-manager

# 安装依赖
npm install
```

> 💡 **原生模块重建提示 (Windows)**：  
> 若启动时遇到 `better-sqlite3` 与 Electron 的 ABI 版本不匹配问题，请在终端执行：
> ```bash
> npx @electron/rebuild -f -w better-sqlite3
> ```

### 3. 启动开发模式
```bash
npm run dev
```
启动后 Vite 会自动编译前端并调起透明无边框桌面窗口。

### 4. 生产打包构建
```bash
npm run app:build
```
执行完毕后，将在 `release/` 目录下生成打包完成的 Windows 安装包与可执行程序。
