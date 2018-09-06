import * as vscode from 'vscode';
import DocProvider from './DocProvider';

export default {
    encodeContent,
    decodeContent
};

function encodeContent(documentUri: vscode.Uri, jsonContent: object): vscode.Uri {
    let encodedQuery = JSON.stringify({ uri: documentUri.toString(), content: jsonContent });
    return vscode.Uri.parse(`${DocProvider.scheme}:json.getter?${encodedQuery}`);
}

function decodeContent(encodedUri: vscode.Uri): {documentUri: vscode.Uri, jsonContent: object} {
    let decodedQuery: { uri: string, content: object } = JSON.parse(encodedUri.query);
    return {
        documentUri: vscode.Uri.parse(decodedQuery.uri),
        jsonContent: decodedQuery.content
    };
}