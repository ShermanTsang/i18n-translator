# i18n-translator

___
![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/ShermanTsang/i18n-translator?label=version)

![Build Status](https://github.com/ShermanTsang/i18n-translator/actions/workflows/npm-publish.yml/badge.svg)

![npm](https://img.shields.io/npm/dt/@shermant/logger)

Initially, I want to write a translation tool for my own another project to reduce the time wasted jobs to translate
i18n files.

When I developed this project, I try to make it easy to use and apply for general handling i18n sceneries.

If this tool can help you, It's my pleasure.

## Feature

- 🤖 Use AI service to translate
- 👁️ Monitor the files change to rerun
- 🙌 Run aside with your project

## Task

### 🔎 Extract

According to the given path, extract the i18n files and save them into the given output path.

### 📚 Translate

With AI services, translate the given i18n files and save them into the given output path.

## Configuration

### Options

| task      | name     | description                                                                                                             |
|-----------|----------|-------------------------------------------------------------------------------------------------------------------------|
| common    | tasks    | The tasks you want to execute.<br/>Any task can run alone.                                                              |
| extract   | pattern  | Receiving both `RegExp` or `string`.<br/>Require including `%key%` to indicate variable                                 |
| extract   | dirs     | The target directories to work                                                                                          |
| extract   | exts     | Only to execute on files with the given extensions.<br/>Require do not including `.` sign                               |
| common    | output   | The place to put output files                                                                                           |
| common    | langs    | Languages you eager to support in your project                                                                          |
| translate | provider | Who is the AI service provider                                                                                          |
| translate | key      | You need API token to access AI service                                                                                 |
| common    | watch    | The tool can monitor your files changes continually.<br/>You can pass any value to this option to enable watching mode. |

### Source

Supporting three ways to set your configurations.

Program will read and merge your configurations with the following order:

1. `.env` file
2. command line parameters
3. inquirer

Learn more, you can find more details in `src/workflow.ts` file

#### 1. `.env` file

You can write some options in your project `.env` file.

Using `TRANSLATION_` as prefix to set configurations.

For example:

```text
TRANSLATOR_PATTERN=^(?i)test
TRANSLATOR_TASKS=extract1,translate
TRANSLATOR_DIRS=./test
TRANSLATOR_TEST=111
TRANSLATOR_KEY=sk-5805c22222228aad2d5386e877fa
```

Remember to use `uppercase` and `snakecase` to express an option.

#### 2. command line parameters

When you use command line to run the project, you can use `--option` to set configurations.

```bash
npx @shermant/i18n-translator --pattern=tttt --exts vue js --watch
```

Notice: the settings in command line will override the settings in `.env` file.

#### 3. inquirer

According to the tasks you choose, program will check the options you need to set before executing.

If there are some options you need to set, program will run into inquirer flow to ask you to input them.

### Provider

Now (2024-09-02), the project only support `deepseek` as the provider.

In the future, I plan to integrate `LangChain` to support variety AI service providers.

## Usage

```bash
npx @shermant/i18n-translator
bunx @shermant/i18n-translator
```

