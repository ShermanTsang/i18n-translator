# @shermant/i18n-translator 预览

[English](./README.md) | [中文](./README.zh.md)

i18n-translator 包的基于网页的预览和测试环境。

## 概述

本包提供了一个交互式的基于浏览器的测试环境，用于预览使用 i18n-translator 库的 React 组件。它具有以下特点：

- 带有语法高亮的实时代码编辑器
- 内置终端，用于运行命令
- WebContainer 集成，用于实时代码执行
- 同步文件更新，提供即时反馈

## 组件

预览环境由以下部分组成：

- **代码编辑器**：由 Prism.js 提供语法高亮的交互式 JavaScript 编辑器
- **终端**：由 xterm.js 提供支持的交互式终端
- **WebContainer**：在隔离环境中执行代码的虚拟容器

## 文件

- `index.html`：预览界面的主要 HTML 布局
- `main.js`：核心功能，包括编辑器、终端和 WebContainer 初始化
- `files.js`：WebContainer 的初始文件系统结构
- `style.css`：预览界面的样式

## 功能

### 同步文件更新

编辑器实现了对 WebContainer 文件系统的实时同步更新。当编辑器中的代码发生变化时，它会立即写入 WebContainer 中的相应文件，确保预览始终保持最新状态。

### 代码编辑器

- JavaScript/JSX 的语法高亮
- Tab 缩进支持
- 语法高亮更新期间保持光标位置
- 支持国际输入法的 IME 输入

### 终端集成

提供由 xterm.js 驱动的完整终端体验，允许您：
- 运行 npm 命令
- 执行脚本
- 查看日志和输出

## 使用方法

1. 在网络浏览器中打开预览
2. 在编辑器面板中编辑 React 代码
3. 在终端面板中查看输出并运行命令
4. 更改会自动同步到 WebContainer 以提供即时预览

## 开发

要修改或扩展预览环境：

1. 更新 `files.js` 以更改初始文件结构
2. 修改 `main.js` 以添加新功能或更改行为
3. 调整 `style.css` 中的样式以自定义外观

## 依赖项

- @xterm/xterm：终端仿真
- @xterm/addon-fit：终端调整大小
- @webcontainer/api：用于代码执行的虚拟容器
- Prism.js：语法高亮
