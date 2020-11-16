const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

function processIndex(projectDir) {
    const indexYamlFile = path.resolve(projectDir, "index.yml");
    if (!fs.existsSync(indexYamlFile)) {
        return null;
    }

    const indexYaml = YAML.parse(fs.readFileSync(indexYamlFile, "utf8"));
    const projectName = indexYaml.items[0].uid;

    indexYaml.items[0].name = "@mcma/" + projectName;
    
    fs.unlinkSync(indexYamlFile);

    return { projectName, indexYaml };
}

function processToc(projectDir, projectName) {
    const tocYamlFile = path.resolve(projectDir, "toc.yml");

    const tocYaml = fs.readFileSync(tocYamlFile, "utf8");
    const tocRoot = YAML.parse(tocYaml)[0];

    tocRoot.uid = projectName;
    tocRoot.name = "@mcma/" + projectName;

    const overviewItem = tocRoot.items.find(x => x.name === "Overview");
    if (overviewItem) {
        tocRoot.items.splice(tocRoot.items.indexOf(overviewItem), 1);
    }

    fs.unlinkSync(tocYamlFile);

    return tocRoot;
}

function processType2DocFxOutput(apiDocRoot) {
    const tocs = [];

    const projectDirs = fs.readdirSync(apiDocRoot).filter(x => fs.statSync(path.resolve(apiDocRoot, x)).isDirectory()).map(x => path.resolve(apiDocRoot, x));

    for (const projectDir of projectDirs) {

        const { projectName, indexYaml } = processIndex(projectDir);
        if (!projectName) {
            continue;
        }

        tocs.push(processToc(projectDir, projectName));

        for (const file of fs.readdirSync(projectDir)) {
            fs.renameSync(path.resolve(projectDir, file), path.resolve(apiDocRoot, projectName + "." + file));
        }

        fs.rmdirSync(projectDir);
    
        fs.writeFileSync(path.resolve(apiDocRoot, projectName + ".yml"), "### YamlMime:UniversalReference\n" + YAML.stringify(indexYaml));
    }

    fs.writeFileSync(path.resolve(apiDocRoot, "toc.yml"), YAML.stringify(tocs));
}

module.exports = processType2DocFxOutput;