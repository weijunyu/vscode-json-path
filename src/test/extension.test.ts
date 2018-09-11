import * as assert from 'assert';
import * as vscode from 'vscode';
import uriTools from '../uriTools';
import DocProvider from '../DocProvider';

describe('Extension tests', function() {
    describe('Uri Tools tests', function() {
        it('can encode URI', function() {
            let docUri = vscode.Uri.parse('file:///path/to/my/doc.json');
            let content = {
                test: 'content'
            };
            let encodedUri: vscode.Uri = uriTools.encodeContent(docUri, content);
            assert.equal(encodedUri.scheme, DocProvider.scheme);
            assert.equal(encodedUri.query, JSON.stringify({
                documentUri: docUri,
                content: content
            }))
        });
    });
});