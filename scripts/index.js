const path = require("path");
const runTypeDoc = require("./run-typedoc");
const processTypeDocOutput = require("./process-typedoc-output");
const runType2DocFx = require("./run-type2DocFx");
const processType2DocFxOutput = require("./process-type2docfx-output");

const apiDocRoot = path.resolve(__dirname, "../api/nodejs");

runTypeDoc(apiDocRoot);
processTypeDocOutput(apiDocRoot);
runType2DocFx(apiDocRoot);
processType2DocFxOutput(apiDocRoot);