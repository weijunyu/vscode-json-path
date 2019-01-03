# [jsonpath](https://github.com/dchester/jsonpath) extension for [Visual Studio Code](https://code.visualstudio.com/)

[![](https://img.shields.io/vscode-marketplace/v/weijunyu.vscode-json-path.svg)](https://marketplace.visualstudio.com/items?itemName=weijunyu.vscode-json-path)

Use [JSONPath expressions](https://github.com/dchester/jsonpath#jsonpath-syntax) to extract and filter data from JSON objects.

Check out https://github.com/stedolan/jq/wiki/For-JSONPath-users for a comparison between JSONPath and [jq](https://stedolan.github.io/jq/).

## Features
Two commands are available through the [command palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette). Type `jsonpath` to bring them up:

- Extract JSON data: real-time results of JSONPath queries. For JSON files.

![demo_query](docs/demo_query.gif)

- Extract JSON data with their paths: real-time results of JSONPath queries, together with path to matches. For JSON files.

![demo_nodes](docs/demo_nodes.gif)

- Also supports searching for any highlighted JSON-formatted text, regardless of file type.

## Dependencies
- [JSONPath library](https://github.com/dchester/jsonpath) from dchester: Query and manipulate JavaScript objects with JSONPath expressions. Robust JSONPath engine for Node.js.