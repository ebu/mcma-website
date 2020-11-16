const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const type2docfxPath = path.resolve(__dirname, "node_modules/type2docfx/dist/main.js");

function runType2DocFx(apiDocRoot) {
    for (const jsonFile of fs.readdirSync(apiDocRoot).filter(x => path.extname(x).toLowerCase() === ".json")) {
        childProcess.execSync(
            [
                "node",
                type2docfxPath,
                path.resolve(apiDocRoot, jsonFile),
                path.resolve(apiDocRoot, path.basename(jsonFile, path.extname(jsonFile)))
            ].join(" ")
        );

        fs.unlinkSync(path.resolve(apiDocRoot, jsonFile));
    }
}

module.exports = runType2DocFx;