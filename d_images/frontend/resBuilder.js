const fs = require('fs');
const ClassView = require('./ClassView')

class resBuilder {
	#elementComposer = ``;
	#nodeInteractor = ``;
	#baseHTML = ``;
	#baseHTMLvs = ``;

	constructor(){
		this.#elementComposer = fs.readFileSync('./libs/ElementComposer.js').toString();
		this.#nodeInteractor = fs.readFileSync('./libs/NodeInteraction.js').toString();
		this.#baseHTML = fs.readFileSync('./libs/body_new.html').toString();
		this.#baseHTMLvs = fs.readFileSync('./libs/body_new_vs.html').toString();
	}

	craftHTMLDOC(nodeJSON, classes){
		var HTMLDOC = this.#baseHTML.replace(/\<111\>/g, this.#elementComposer);
		HTMLDOC = HTMLDOC.replace(/\<222\>/g, this.#nodeInteractor);
		HTMLDOC = HTMLDOC.replace(/\<333\>/g, btoa(JSON.stringify(nodeJSON)));
		HTMLDOC = HTMLDOC.replace(/\<444\>/g, ClassView.generateClassDiagram(classes));
		return HTMLDOC;
	}

	craftHTMLDOC_vscode(nodeJSON, classes){
		var HTMLDOC = this.#baseHTMLvs.replace(/\<111\>/g, this.#elementComposer);
		HTMLDOC = HTMLDOC.replace(/\<222\>/g, this.#nodeInteractor);
		HTMLDOC = HTMLDOC.replace(/\<333\>/g, btoa(JSON.stringify(nodeJSON)));
		HTMLDOC = HTMLDOC.replace(/\<444\>/g, ClassView.generateClassDiagram(classes));
		return HTMLDOC;
	}
}
module.exports = resBuilder;
