# i18n-translator

<div align="center">

[![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/ShermanTsang/i18n-translator?label=version)](https://github.com/ShermanTsang/i18n-translator/releases)
[![Build Status](https://github.com/ShermanTsang/i18n-translator/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/ShermanTsang/i18n-translator/actions/workflows/npm-publish.yml)
[![npm](https://img.shields.io/npm/dt/@shermant/i18n-translator)](https://www.npmjs.com/package/@shermant/i18n-translator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**English** | [中文](./README.zh.md)

</div>

> A powerful and user-friendly i18n translation tool powered by AI

I initially created this translation tool for one of my other projects to reduce the time spent translating i18n files.
While developing this project, I aimed to make it user-friendly and versatile for general i18n use cases.
If this tool helps you, it would be my pleasure.

## 📋 Table of Contents

- [Features](#-features)
- [Getting Started](#-getting-started)
- [Repository Structure](#-repository-structure)
- [Tasks](#-tasks)
- [Configuration](#️-configuration)
- [Usage](#-usage)
- [Examples](#-examples)
- [Contributing](#-contributing)
- [Links](#-links)
- [License](#-license)

## ✨ Features

- 🤖 **AI-Powered Translation**: Leverage cutting-edge AI services for accurate and efficient translations
- 👁️ **File Monitoring**: Automatically detect and re-process files when changes occur
- 🙌 **Easy Integration**: Run alongside your project with minimal configuration
- 🌐 **Multiple Languages**: Support for a wide range of languages and translation providers
- 📦 **Zero Dependencies**: Lightweight setup with minimal impact on your project

## 🚀 Getting Started

### Installation

```bash
# Using npm
npm install @shermant/i18n-translator --save-dev

# Using yarn
yarn add @shermant/i18n-translator --dev

# Using pnpm
pnpm add @shermant/i18n-translator --save-dev

# Using bun
bun add @shermant/i18n-translator --dev
```

### Quick Start

Create a basic configuration in your project root:

```bash
# Run the tool with interactive prompts
npx @shermant/i18n-translator
```

## 📋 Repository Structure

This project is a [monorepo](https://en.wikipedia.org/wiki/Monorepo) containing:

- `packages/code`: The main package with core functionality
- `packages/preview`: A single web page previewing the translation result built with WebContainer

## 📊 Tasks

### 🔎 Extract

Extract i18n keys from the specified path and save them to the designated output directory.

### 📚 Translate

Translate i18n files using AI services and save the results to the specified output directory.

## ⚙️ Configuration

### Options

| Task      | Name     | Description                                                                                  |
| --------- | -------- | -------------------------------------------------------------------------------------------- |
| common    | tasks    | The tasks you want to execute. Any task can be run individually.                             |
| extract   | pattern  | Accepts RegExp or string. Must include %key% to indicate a variable.                         |
| extract   | dirs     | The target directories for the operation.                                                    |
| extract   | exts     | Only executes on files with the specified extensions. Do not include the . in the extension. |
| common    | output   | The directory where output files will be saved.                                              |
| translate | langs    | The languages you wish to support in your project.                                           |
| translate | provider | The AI service provider.                                                                     |
| translate | key      | The API token required to access the AI service.                                             |
| common    | watch    | Enables file monitoring for continuous execution. Pass any value to enable watching mode.    |

### Configuration Methods

You can configure the tool using three different methods, with the settings being read and merged in the following order:

1. `.env` file
2. Command line parameters
3. Inquirer prompts

For more details, refer to the `src/workflow.ts` file.

#### 1. `.env` file

You can specify options in your project's `.env` file using the `TRANSLATION_` prefix.

For example:

```text
TRANSLATOR_PATTERN=^(?i)test
TRANSLATOR_TASKS=extract1,translate
TRANSLATOR_DIRS=./test
TRANSLATOR_TEST=111
TRANSLATOR_KEY=sk-5805c22222228aad2d5386e877fa
```

Ensure that all options are in `UPPERCASE` and `SNAKE_CASE`.

#### 2. Command line parameters

When running the project from the command line, you can use `--option` to set configurations.

```bash
npx @shermant/i18n-translator --pattern=tttt --exts vue js --watch
```

Note: Command line settings will override those in the .env file.

#### 3. Inquirer

Based on the selected tasks, the program will check which options need to be set before execution.

If any options are missing, the program will prompt you to input them through an inquirer flow.

### Provider

As of March 2025, the project supports `deepseek` as the AI service provider.

In the future, I plan to integrate `LangChain` to support a variety of AI service providers.

## 🚀 Usage

```bash
# Using npx (npm)
npx @shermant/i18n-translator

# Using bunx (bun)
bunx @shermant/i18n-translator
```

## 📝 Examples

### Basic extraction and translation

```bash
npx @shermant/i18n-translator --tasks=extract,translate --dirs=./src --pattern="t\('%key%'\)" --langs=zh-CN,en,ja
```

### Watch mode for continuous translation

```bash
npx @shermant/i18n-translator --watch --dirs=./src,./components
```

## 👥 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🔗 Links

- [GitHub Repository](https://github.com/ShermanTsang/i18n-translator)
- [NPM Package](https://www.npmjs.com/package/@shermant/i18n-translator)
- [Issue Tracker](https://github.com/ShermanTsang/i18n-translator/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
