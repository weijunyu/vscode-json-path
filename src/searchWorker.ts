const jsonPath = require("jsonpath");

module.exports = (
  searchInput: { contents: object; inputText: string },
  jsonPathOptions: { nodes: boolean },
  callback: any
) => {
  try {
    let matches = getJsonMatches(
      searchInput.contents,
      searchInput.inputText,
      jsonPathOptions
    );
    callback(null, matches);
  } catch (err) {
    callback(err);
  }
};

interface JsonPathOptions {
  nodes: boolean;
}

function getJsonMatches(
  contents: object,
  inputPath: string,
  jsonPathOptions: JsonPathOptions
): string[] {
  if (jsonPathOptions.nodes) {
    let nodes = jsonPath.nodes(contents, inputPath);
    return nodes.map((node: { path: Array<string | number>; value: any }) => {
      return {
        [jsonPath.stringify(node.path)]: node.value
      };
    });
  } else {
    return jsonPath.query(contents, inputPath);
  }
}
