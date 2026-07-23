# Echo Domain · 音域回响 Web

一个完全在浏览器中运行的音乐响应式三维柱阵。它使用 Web Audio API 分析系统共享音频，并通过 Three.js、GLSL 和 GPU 实例化渲染生成频谱地形、扩散波纹与动态色彩。

## 来源说明

本项目的创作方向受到 Steam 创意工坊作品 **《音域回响》** 启发：

- 原作品作者：CmzYa
- 原作品页面：[Steam 创意工坊 · 音域回响](https://steamcommunity.com/sharedfiles/filedetails/?id=3747222633)

经项目维护者明确授权，本仓库提取并包含了让原 Web 壁纸运行所必需的编译脚本、样式与属性定义。相关文件位于 `vendor/sonic-topography/`，其著作权仍归原作者所有。

## 功能

- 原版 160×160 实例化柱阵和 FFT 律动
- 原版低频波纹、高频流星、粒子和空闲动画
- 浏览器系统音频共享桥
- 原版属性的浏览器设置面板
- 设置持久化和 GPU 诊断
- 多套原版主题、相机与渲染精度设置

音频只在本地浏览器中处理，不会上传。

## 本地启动

```bash
npm install
npm run dev
```

打开终端显示的地址，通常为 `http://localhost:5173`。

## 生产构建

```bash
npm run build
npm run preview
```

## 系统音频

点击“连接系统音频”，在浏览器共享弹窗中选择整个屏幕并启用“共享系统音频”。推荐 Windows 上的最新版 Chrome 或 Edge。

浏览器不能静默取得系统输出，因此每次重新打开页面后都需要用户授权。

## GPU

WebGL 会请求高性能 GPU，但最终显卡选择由浏览器和操作系统决定。混合显卡设备如始终使用核显，可在 Windows 图形设置中指定浏览器使用高性能 GPU，或开启独显直连。

## 代码结构

- `vendor/sonic-topography/wallpaper.js`：原壁纸必要编译程序
- `vendor/sonic-topography/wallpaper.css`：原壁纸必要样式
- `wallpaper-properties.json`：原壁纸设置定义
- `audio-bridge.js`：系统音频、浏览器设置和 GPU 适配
- `index.html`：浏览器运行入口

## 许可与边界

本项目仅声明对浏览器适配代码的权利。《音域回响》的名称、原始程序、样式、设计及相关权利归其原作者所有。公开分发与使用仍应遵守原作者和 Steam 创意工坊的相关要求。
