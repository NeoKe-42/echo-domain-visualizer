# Echo Domain · 音域回响 Web

一个完全在浏览器中运行的音乐响应式三维柱阵。它使用 Web Audio API 分析系统共享音频，并通过 Three.js、GLSL 和 GPU 实例化渲染生成频谱地形、扩散波纹与动态色彩。

> [!IMPORTANT]
> 本项目是个人学习与技术研究性质的非官方浏览器适配，**未获得原作者的完整再分发或商业授权**。原作品及提取的必要运行文件版权均归原作者所有。本仓库不提供任何关于原作品的授权；如原作者认为内容不适合公开，请通过仓库 Issue 联系，相关文件将及时移除。

## 来源说明

本项目的创作方向受到 Steam 创意工坊作品 **《音域回响》** 启发：

- 原作品作者：CmzYa
- 原作品页面：[Steam 创意工坊 · 音域回响](https://steamcommunity.com/sharedfiles/filedetails/?id=3747222633)

为了进行浏览器兼容性研究，本仓库提取了让 Web 壁纸运行所必需的编译脚本、样式与属性定义。相关文件位于 `vendor/sonic-topography/`，其著作权仍归原作者所有。这里的收录不代表已获得完整授权，也不构成对原作品权利的主张。

## 功能

- 原版 160×160 实例化柱阵和 FFT 律动
- 原版低频波纹、高频流星、粒子和空闲动画
- 浏览器系统音频共享桥
- 原版属性的浏览器设置面板
- 设置持久化和 GPU 诊断
- 多套原版主题、相机与渲染精度设置

音频只在本地浏览器中处理，不会上传。

## 下载项目

不熟悉 Git 的用户可以直接下载压缩包：

- [下载项目 ZIP（main 分支）](https://github.com/NeoKe-42/echo-domain-visualizer/archive/refs/heads/main.zip)

下载完成后，右键解压 ZIP。后续命令需要在解压后的项目目录中执行。

已经安装 Git 的用户也可以运行：

```bash
git clone https://github.com/NeoKe-42/echo-domain-visualizer.git
cd echo-domain-visualizer
```

## 安装 Node.js 和 npm

本项目需要 Node.js。**npm 会随 Node.js 一起安装，不需要单独下载 npm。**

1. 打开 [Node.js 官方下载页面](https://nodejs.org/en/download)。
2. 下载并安装标有 **LTS** 的版本。Windows 用户可使用官方安装程序，并保留默认安装选项。
3. 安装结束后，关闭并重新打开终端、PowerShell 或命令提示符。
4. 运行以下命令检查是否安装成功：

```bash
node -v
npm -v
```

两条命令都显示版本号即可继续。

> [!TIP]
> Windows 用户如果输入 `npm` 后提示命令不存在，或者 PowerShell 提示无法加载 `npm.ps1`，可以直接使用 `npm.cmd`。无需为了运行本项目修改 PowerShell 执行策略。

```bat
node -v
npm.cmd -v
```

如果 `node` 和 `npm.cmd` 也都无法识别，请重新安装 Node.js，安装完成后重启终端；必要时重启电脑。

## 本地启动

先用终端进入解压后的项目目录。该目录中应当能看到 `package.json` 文件，然后运行：

```bash
npm install
npm run dev
```

打开终端显示的地址，通常为 `http://localhost:5173`。

### Windows 使用 npm.cmd

如果你的电脑无法直接运行 `npm`，上面的命令全部改为 `npm.cmd`：

```bat
npm.cmd install
npm.cmd run dev
```

终端显示本地地址后，按住 `Ctrl` 并单击地址，或将地址复制到 Chrome/Edge 中打开。开发服务器运行期间不要关闭该终端；需要停止时按 `Ctrl+C`。

## 生产构建

```bash
npm run build
npm run preview
```

Windows 上对应的 `npm.cmd` 命令为：

```bat
npm.cmd run build
npm.cmd run preview
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

本项目仅声明对浏览器适配代码的权利。《音域回响》的名称、原始程序、样式、设计及相关权利归其原作者所有。

- 本仓库不授予原作品或 vendor 文件的复制、再发布、修改或商业使用许可。
- 使用者应自行取得 Wallpaper Engine 原作品，并遵守原作者、Steam 创意工坊和 Wallpaper Engine 的相关条款。
- 本项目与原作者、Steam 或 Wallpaper Engine 官方无关联，也未获得其背书。
- 如涉及权利问题，请提交 Issue；维护者会优先处理删除或下架请求。
