const babylon = require('babylon');
const traverse = require("babel-traverse").default;
const generator = require("babel-generator").default;
const fs = require('fs');
const path = require('path');
const util = require('util');
const PromiseMigration = require('./configs/PromiseMigration');

const promiseMigrator = new PromiseMigration();

const config = require('./options.cfg');

class Explorer {
    constructor() {
        this.definer = "require('lodash')";
        this.path = './Apps/';
        this.excludedPaths = [];
        this.filesWithInjection = [];
        this.replaceRules = {};
        this.artefacts = [];
    }

    setPath(path) {
        if (path) {
            this.path = path;
        }
    }

    setLodashDefiner(definer) {
        this.definer = definer;
    }

    searchInjectionInFiles() {
        this.filesWithInjection = [];
        this.filesWithInjection = this._dirWalker(this.path);
    }

    excludePath(path) {
        if (!this.excludedPaths) {
            this.excludedPaths = [];
        }
        if (!(this.excludedPaths.indexOf(path) > -1)) {
            this.excludedPaths.push(path);
        }
    }

    _checkPathIsExcluded(dir) {
        let isExcluded = false;
        this.excludedPaths.forEach(path => {
            const re = new RegExp(path);
            if (re.test(dir)) {
                isExcluded = true;
            }
        })
        return isExcluded;
    }

    _dirWalker(dir) {
        let fList = [];
        if (this._checkPathIsExcluded(dir)) {
            return fList;
        }

        var filesList = fs.readdirSync(dir, 'utf8');

        filesList.forEach(file => {
            file = path.resolve(dir, file);
            const fileStat = fs.statSync(file);

            if (fileStat && fileStat.isDirectory()) {
                fList = fList.concat(this._dirWalker(file));
            } else {
                if (this._verifyFile(file)) {
                    fList.push(file);
                }
            }
        });

        return fList;
    }

    _verifyFile(file) {
        let isFileCorrect = true;
        if (!['.js', '.jsx', '.ts', '.tsx'].includes(path.extname(file).toLowerCase())) {
        // if (!['.js', '.jsx'].includes(path.extname(file).toLowerCase())) {
            isFileCorrect = false;
        }

        if (!isFileCorrect) {
            return isFileCorrect;
        }

        const content = fs.readFileSync(file, 'utf8');

        if (!(content.indexOf(this.definer) > -1)) {
            isFileCorrect = false;
        }

        if (!isFileCorrect) {
            return isFileCorrect;
        }

        return isFileCorrect;
    }

    getFiles() {
        return this.filesWithInjection;
    }

    setReplaceRules(rules) {
        this.replaceRules = rules;
    }

    applyReplaceRules(files) {
        let count = 0;
        files.forEach(file => {
            console.log(file)
            const ast = babylon.parse(fs.readFileSync(file, 'utf8'), {
                sourceType: 'module',
                plugins: [
                    // 'estree',
                    'jsx',
                    'typescript',
                    // flow
                    // doExpressions
                    'objectRestSpread',
                    'exportDefaultFrom',
                    // decorators
                    'classProperties'
                    // 'exportExtensions',
                    // 'asyncGenerators',
                    // 'functionBind',
                    // functionSent
                    // 'dynamicImport'
                    // templateInvalidEscapes
                ]
            });

            traverse(ast, promiseMigrator.getVisitorObject());
            // const o = generator(ast).code;
            fs.writeFile(file, generator(ast).code, 'utf8', err => {
                if (err) return console.log(err);
            });
        });
        return count;
    }

    setArtefactRules(rules) {
        this.artefacts = rules;
    }

    findArtefacts(files) {
        let artefactsData = {};
        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            this.artefacts.forEach(artefact => {
                if (content.indexOf('.' + artefact + '(') > -1) {
                    if (!artefactsData[artefact]) {
                        artefactsData[artefact] = [];
                    }
                    artefactsData[artefact].push(file);
                }
            })
        });
        return artefactsData;
    }

    saveArtefactsInfo(filename, artefacts) {
        fs.writeFileSync(filename, util.inspect(artefacts) , 'utf-8');
    }

    setCore(core) {
        if (core) {
            this.definer = core;
        }
    }

    replaceCore(files) {
        let count = 0;
        files.forEach(file => {
            let content = fs.readFileSync(file, 'utf8');
            // content = content.replace(new RegExp('app\\(\'LoDash\'', 'g'), 'require(\'lodash\'');
        content = content.replace(new RegExp('lodash3', 'g'), 'lodash');
            count++;
            fs.writeFileSync(file, content);
        });
        return count;
    }
}

console.log('--------', 'Init');
const rpl = new Explorer();

console.log('--------', 'Setup');
config.exclude.forEach(path => rpl.excludePath(path));
rpl.setCore(config.core);
rpl.setPath(config.path);

console.log('--------', 'Start search');
console.log('--------', 'Find files with injections');
rpl.searchInjectionInFiles();
const files = rpl.getFiles();

console.log('--------', files.length, 'files use that lib....');
fs.writeFileSync('outNEW', files.join('\r\n') , 'utf-8');
// const coreReplaced = rpl.replaceCore(files);

// console.log('--------', coreReplaced, 'cores replaced. Replacing....');
rpl.setReplaceRules(config.replace); // TODO standard methods een replaced also
const filesWithReplacements = rpl.applyReplaceRules(files);

console.log('--------', filesWithReplacements, 'files with replacements applied. Finding artefacts....');
// rpl.setArtefactRules(config.artefacts);
// const artefacts = rpl.findArtefacts(files);
//
// console.log('--------', 'Artefacts found. Saving info....');
// rpl.saveArtefactsInfo('./artefacts.log', artefacts);

console.log('--------', 'Done');

function transform(AST) {
    return estraverse.replace(AST, {
        enter: function(node) {
            if (
                node.type === estraverse.Syntax.CallExpression &&
                node.callee.property &&
                node.callee.property.name === 'done'
            ) {

            }
                // if (node.type === estraverse.Syntax.Literal) {
             return node;
                // }

        }
    });
}
