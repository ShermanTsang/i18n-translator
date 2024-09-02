# i18n-translator

___
![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/ShermanTsang/i18n-translator?label=version)

![Build Status](https://github.com/ShermanTsang/i18n-translator/actions/workflows/npm-publish.yml/badge.svg)

![npm](https://img.shields.io/npm/dt/@shermant/logger)

I initially created this translation tool for one of my other projects to reduce the time spent translating i18n files.

While developing this project, I aimed to make it user-friendly and versatile for general i18n use cases.

If this tool helps you, it would be my pleasure.

## Feature

- 🤖 Utilize AI services for translation
- 👁️ Monitor file changes for automatic re-execution
- 🙌 Run alongside your project with ease

## Task

### 🔎 Extract

Extract i18n files from the specified path and save them to the designated output directory.

### 📚 Translate

Translate i18n files using AI services and save the results to the specified output directory.

## Configuration

### Options

| task      | name     | description                                                                                      |
|-----------|----------|--------------------------------------------------------------------------------------------------|
| common    | tasks    | The tasks you want to execute.<br/>Any task can be run individually.                             |
| extract   | pattern  | Accepts both RegExp or string.<br/>Must include %key% to indicate a variable.                    |
| extract   | dirs     | The target directories for the operation.                                                        |
| extract   | exts     | Only executes on files with the specified extensions.<br/>Do not include the . in the extension. |
| common    | output   | The directory where output files will be saved.                                                  |
| common    | langs    | The languages you wish to support in your project.                                               |
| translate | provider | The AI service provider.                                                                         |
| translate | key      | The API token required to access the AI service.                                                 |
| common    | watch    | Enables file monitoring for continuous execution.<br/>Pass any value to enable watching mode.    |

### Source

You can configure the tool using three different methods, with the settings being read and merged in the following
order:

1. `.env` file
2. Command line parameters
3. Inquirer prompts

For more details, refer to the `src/workflow.ts` file.

#### 1. `.env` file

You can specify options in your project’s `.env` file using the `TRANSLATION_` prefix.

For example:

```text
TRANSLATOR_PATTERN=^(?i)test
TRANSLATOR_TASKS=extract1,translate
TRANSLATOR_DIRS=./test
TRANSLATOR_TEST=111
TRANSLATOR_KEY=sk-5805c22222228aad2d5386e877fa
```

Ensure that all options are in `UPPERCASE` and `SNAKE_CASE`.

#### 2. command line parameters

When running the project from the command line, you can use `--option` to set configurations.

```bash
npx @shermant/i18n-translator --pattern=tttt --exts vue js --watch
```

Note: Command line settings will override those in the .env file.

#### 3. inquirer

Based on the selected tasks, the program will check which options need to be set before execution.

If any options are missing, the program will prompt you to input them through an inquirer flow.

### Provider

As of 2024-09-02, the project supports `deepseek` as the AI service provider.

In the future, I plan to integrate `LangChain` to support a variety of AI service providers.

## Usage

```bash
npx @shermant/i18n-translator
bunx @shermant/i18n-translator
```

This version is more polished and clearer, ensuring proper grammar and consistent formatting.


