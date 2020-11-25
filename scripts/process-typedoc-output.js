const fs = require("fs");
const path = require("path");

function flattenProject(project) {
    const children = [];
    for (const node of project.children) {
        addNonModules(children, node);
    }
    project.name = project.name.replace("@mcma/", "");
    project.children = children;
}

function addNonModules(children, node) {
    node.name = node.name.replace("@mcma/", "");
    if (node.kindString === "Module") {
        for (const child of node.children) {
            addNonModules(children, child);
        }
    } else if (node.kindString !== "Type alias") {
        children.push(node);
    }
}

function processTypeDocOutput(apiDocRoot) {
    const projectFiles = fs.readdirSync(apiDocRoot).filter(f => path.extname(f).toLowerCase() === ".json").map(f => apiDocRoot + "/" + f);
    for (const projectFile of projectFiles) {
        const project = JSON.parse(fs.readFileSync(projectFile));
        flattenProject(project);
        fs.writeFileSync(projectFile, JSON.stringify(project, null, 2));
    }
}

module.exports = processTypeDocOutput;