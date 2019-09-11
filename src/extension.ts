import * as vscode from "vscode";
import DocProvider from "./DocProvider";
import uriTools from "./uriTools";

const workerFarm = require("worker-farm");
const searchWorker = workerFarm(require.resolve("./searchWorker"));

export function activate(context: vscode.ExtensionContext) {
  let JsonDocProvider = new DocProvider();
  // Register scheme
  context.subscriptions.push(
    vscode.Disposable.from(
      vscode.workspace.registerTextDocumentContentProvider(
        DocProvider.scheme,
        JsonDocProvider
      )
    )
  );

  let jsonPathCommand = vscode.commands.registerTextEditorCommand(
    "extension.jsonPath",
    async (editor: vscode.TextEditor) => {
      let inputBoxOptions: Partial<InputBoxParameters> = {
        title: "JSON path query",
        prompt: "Enter JSON path",
        placeholder: "$.a[0].b.c",
        ignoreFocusOut: true
      };
      let contents: object | Array<any>; // JSON file contents
      try {
        let doc = editor.document;
        contents = JSON.parse(doc.getText());
      } catch (exception) {
        vscode.window.showErrorMessage(
          "Error parsing JSON; please make sure it is properly formatted."
        );
        return;
      }
      const inputText = await vscode.window.showInputBox(inputBoxOptions);
      if (inputText && inputText.length > 0) {
        searchAndDisplayResults({ inputText, contents }, editor);
      }
    }
  );

  let jsonPathWithNodesCommand = vscode.commands.registerTextEditorCommand(
    "extension.jsonPathWithNodes",
    async (editor: vscode.TextEditor) => {
      let inputBoxOptions: Partial<InputBoxParameters> = {
        title: "JSON path with nodes",
        prompt: "Enter JSON path",
        placeholder: "$.a[0].b.c",
        ignoreFocusOut: true
      };
      let contents: object | Array<any>; // JSON file contents
      try {
        let doc = editor.document;
        contents = JSON.parse(doc.getText());
      } catch (exception) {
        vscode.window.showErrorMessage(
          "Error parsing JSON; please make sure it is properly formatted."
        );
        return;
      }
      const inputText = await vscode.window.showInputBox(inputBoxOptions);
      if (inputText && inputText.length > 0) {
        searchAndDisplayResults({ inputText, contents, nodes: true }, editor);
      }
    }
  );

  // Register command
  context.subscriptions.push(jsonPathCommand, jsonPathWithNodesCommand);
}

interface SearchOptions {
  inputText: string;
  contents: object | Array<any>;
  nodes?: boolean;
}

interface InputBoxParameters {
  title: string;
  step: number;
  totalSteps: number;
  value: string;
  prompt: string;
  placeholder: string;
  ignoreFocusOut: boolean;
}

async function searchAndDisplayResults(
  { inputText, contents, nodes = false }: SearchOptions,
  editor: vscode.TextEditor
) {
  let searchPromise: Thenable<string[]> = vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Parsing JSON path...",
      cancellable: true
    },
    (progress, token) => {
      token.onCancellationRequested(() => {});
      return new Promise((resolve, reject) => {
        searchWorker(
          {
            contents,
            inputText
          },
          { nodes },
          (err: any, output: any) => {
            if (err) {
              let errorMessage = err.message;
              if (
                errorMessage.indexOf("Parse error") > -1 ||
                errorMessage.indexOf("Lexical error") > -1
              ) {
                errorMessage =
                  "Please make sure your JSON path expression is valid!";
              }
              vscode.window.showErrorMessage(errorMessage);
              reject(err);
            }
            resolve(output);
          }
        );
      });
    }
  );
  searchPromise.then(async (jsonMatches: string[]) => {
    let uri = uriTools.encodeContent(editor.document.uri, jsonMatches);
    let jsonDoc = await vscode.workspace.openTextDocument(uri);
    try {
      await vscode.languages.setTextDocumentLanguage(jsonDoc, "json");
    } catch (error) {
      console.error(error);
    }
    if (editor.viewColumn && editor.viewColumn < 4) {
      await vscode.window.showTextDocument(jsonDoc, {
        preserveFocus: true,
        viewColumn: editor.viewColumn + 1
      });
    }
  });
}
