const fs = require("fs");
const path = require("path");
const typeDoc = require("typedoc");

const libsRoot = "../mcma-libraries";
const typeDocOptionsPath = path.resolve(__dirname, "typedoc.json");

const projectGroups = [
    "base",
    "aws",
    "azure",
    "google-cloud"
];

function getTypeDocOptions(apiDocRoot, projectGroup, project) {
    const projectSrcFolder = path.resolve(libsRoot, projectGroup, project);
    return {
        inputFiles: [projectSrcFolder],
        options: typeDocOptionsPath,
        tsconfig: path.resolve(projectSrcFolder, "tsconfig.json"),
        json: path.resolve(apiDocRoot, projectGroup + "-" + project + ".json")
    };
};

function runTypeDoc(apiDocRoot) {
    for (const projectGroup of projectGroups) {
        const projectGroupFolder = path.resolve(libsRoot, projectGroup);
        for (const project of fs.readdirSync(projectGroupFolder).filter(x => fs.statSync(path.resolve(projectGroupFolder, x)).isDirectory())) {
            const typeDocCli = new typeDoc.CliApplication();
            typeDocCli.bootstrap(getTypeDocOptions(apiDocRoot, projectGroup, project));
        }
    }
}

module.exports = runTypeDoc;