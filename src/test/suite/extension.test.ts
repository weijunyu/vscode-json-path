import * as assert from "assert";
import { before } from "mocha";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../extension';

import uriTools from "../../uriTools";
import DocProvider from "../../DocProvider";

suite("Extension Test Suite", () => {
    before(() => {
        vscode.window.showInformationMessage("Start all tests.");
    });

    test("can encode URI", () => {
        let docUri = vscode.Uri.parse("file:///path/to/my/doc.json");
        let content = {
            test: "content"
        };
        let encodedUri: vscode.Uri = uriTools.encodeContent(docUri, content);
        assert.equal(encodedUri.scheme, DocProvider.scheme);
        assert.equal(
            encodedUri.query,
            JSON.stringify({
                documentUri: docUri,
                content: content
            })
        );
    });
});
