# i18n-translator

<div align="center">

[![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/ShermanTsang/i18n-translator?label=version)](https://github.com/ShermanTsang/i18n-translator/releases)
[![Build Status](https://github.com/ShermanTsang/i18n-translator/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/ShermanTsang/i18n-translator/actions/workflows/npm-publish.yml)
[![npm](https://img.shields.io/npm/dt/@shermant/i18n-translator)](https://www.npmjs.com/package/@shermant/i18n-translator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](./README.md) | **中文**

</div>

> 一个强大且用户友好的 AI 驱动 i18n 翻译工具

我最初创建这个翻译工具是为了减少在翻译其他项目的 i18n 文件时所花费的时间。
在开发这个项目的过程中，我的目标是使其对一般的 i18n 用例既用户友好又多功能。
如果这个工具对你有所帮助，我将非常高兴。

## 📋 目录

- [特点](#-特点)
- [快速开始](#-快速开始)
- [仓库结构](#-仓库结构)
- [任务](#-任务)
- [配置](#️-配置)
- [使用方法](#-使用方法)
- [示例](#-示例)
- [贡献](#-贡献)
- [链接](#-链接)
- [许可证](#-许可证)

## ✨ 特点

- 🤖 **AI 驱动翻译**：利用先进的 AI 服务进行精准高效的翻译
- 👁️ **文件监控**：当文件发生变化时自动检测并重新处理
- 🙌 **轻松集成**：通过最简配置与您的项目并行运行
- 🌐 **多语言支持**：支持广泛的语言和翻译提供商
- 📦 **零依赖**：轻量级设置，对项目影响最小

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install @shermant/i18n-translator --save-dev

# 使用 yarn
yarn add @shermant/i18n-translator --dev

# 使用 pnpm
pnpm add @shermant/i18n-translator --save-dev

# 使用 bun
bun add @shermant/i18n-translator --dev
```

### 快速入门

在项目根目录创建基本配置：

```bash
# 运行工具并通过交互式提示配置
npx @shermant/i18n-translator
```

## 📋 仓库结构

这个项目是一个 [monorepo](https://en.wikipedia.org/wiki/Monorepo)，包含：

- `packages/code`: 包含核心功能的主要包
- `packages/preview`: 一个使用 WebContainer 构建的用于预览翻译结果的单页应用

## 📊 任务

### 🔎 提取

从指定路径提取 i18n 键，并将它们保存到指定的输出目录中。

### 📚 翻译

使用 AI 服务翻译 i18n 文件，并将结果保存到指定的输出目录中。

## ⚙️ 配置

### 选项

| 任务      | 名称     | 描述                                                                                 |
|-----------|----------|--------------------------------------------------------------------------------------|
| common    | tasks    | 你想要执行的任务。每个任务都可以单独运行。                                           |
| extract   | pattern  | 接受正则表达式或字符串。必须包含 %key% 来指示变量。                                  |
| extract   | dirs     | 操作的目标目录。                                                                     |
| extract   | exts     | 仅在具有指定扩展名的文件上执行。不要在扩展名中包含 .                                 |
| common    | output   | 输出文件将被保存的目录。                                                             |
| translate | langs    | 你希望在项目中支持的语言。                                                           |
| translate | provider | AI 服务提供商。                                                                      |
| translate | key      | 访问 AI 服务所需的 API 令牌。                                                        |
| common    | watch    | 启用文件监视以连续执行。传递任何值以启用监视模式。                                   |

### 配置方法

您可以使用三种不同的方法配置工具，设置将按以下顺序读取和合并：

1. `.env` 文件
2. 命令行参数
3. Inquirer 提示

有关更多详细信息，请参阅 `src/workflow.ts` 文件。

#### 1. `.env` 文件

您可以在项目的 `.env` 文件中使用 `TRANSLATION_` 前缀指定选项。

例如：

```text
TRANSLATOR_PATTERN=^(?i)test
TRANSLATOR_TASKS=extract1,translate
TRANSLATOR_DIRS=./test
TRANSLATOR_TEST=111
TRANSLATOR_KEY=sk-5805c22222228aad2d5386e877fa
```

确保所有选项都使用 `大写` 和 `下划线命名法`。

#### 2. 命令行参数

从命令行运行项目时，可以使用 `--option` 设置配置。

```bash
npx @shermant/i18n-translator --pattern=tttt --exts vue js --watch
```

注意：命令行设置将覆盖 .env 文件中的设置。

#### 3. Inquirer

根据选定的任务，程序将检查执行前需要设置哪些选项。

如果缺少任何选项，程序将通过 inquirer 流程提示您输入。

### 提供商

截至 2025 年 3 月，该项目支持 `deepseek` 作为 AI 服务提供商。

未来，我计划集成 `LangChain` 以支持各种 AI 服务提供商。

## 🚀 使用方法

```bash
# 使用 npx (npm)
npx @shermant/i18n-translator

# 使用 bunx (bun)
bunx @shermant/i18n-translator
```

## 📝 示例

### 基本提取和翻译

```bash
npx @shermant/i18n-translator --tasks=extract,translate --dirs=./src --pattern="t\('%key%'\)" --langs=zh-CN,en,ja
```

### 监视模式持续翻译

```bash
npx @shermant/i18n-translator --watch --dirs=./src,./components
```

## 👥 贡献

欢迎贡献！请随时：

1. Fork 这个仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交你的更改：`git commit -m '添加优秀功能'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 开启一个 Pull Request

## 🔗 链接

- [GitHub 仓库](https://github.com/ShermanTsang/i18n-translator)
- [NPM 包](https://www.npmjs.com/package/@shermant/i18n-translator)
- [问题跟踪](https://github.com/ShermanTsang/i18n-translator/issues)

## 📄 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。
