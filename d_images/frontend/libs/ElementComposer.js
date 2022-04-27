class ElementComposer {
	// Constants
	static #MAX_WIDTH = 200;
	static #TitleY    = 5; // The y coordinate of where text should begin
	static #ERROR_WIDTH = 500;

	// Colors

	// Function Colors
	static #FunctionNameBlock 	= '#FFD966'; // text = black
	static #FunctionBody		= '#FFF2CC';
	static #FunctionBodyText	= '#FFC000';
	static #FunctionStroke		= '#FFC000';

	// Class Colors
	static #ClassNameBlock 		= '#F4B183'; // text = black
	static #ClassBody			= '#FBE5D6';
	static #ClassStroke			= '#ED7D31';

	// Variable Colors
	static #VariableBody		= '#BDD7EE';
	static #VariableStroke		= '#4372C4';

	// Heap Node Colors
	static #HeapBody			= '#F2F2F2';
	static #HeapDots 			= '#AFABAB';
	static #HeapStroke			= '#767171';
	static HeapBodyBG			= "#EDEDED";
	static #HeapHeadBg			= "#D9D9D9";
	static HeapTxt				= "#7F7F7F";
	
	// Loop Node Colors
	static #LoopBody			= '#E2F0D9';
	static #LoopStroke 			= '#548235';
	
	// Functions
	
	//Internal Functions

	/*
		getTextDimensions(text):
		Description: 
		Calculates the Dimensions of a piece of text under the
		assumptions that the text is bold, 20pt, and Consolas.
		This function is used to obtain the dimension used in
		the name block of variables, functions and classes.
		Parameter:
			text 		String
		Return: {"width":<text_width>, "height":<text_height>}
		Note: 
		The dimensions of a single consolas 20pt character 
		inside an SVG element is 11*23.2. Due to overlapping, the
		height of the text can be regarded as 15 pixels.
	*/
	static #getTextDimensions(text){
		//if(text == "") return {"width":0, "height":0};
		var width = Math.min(Math.ceil(11 * text.length), this.#MAX_WIDTH) || 0;
		var height = 15 * Math.ceil(11 * text.length / this.#MAX_WIDTH) || 0;
		return {"width":width, "height":height};
	}

	/*
		generateTextElement(text,paddingLeft,centerY,fontSize,fontWeight,txtColor)
		Description:
		Generates an SVG text element to be used in the construction of other,
		larger SVG objects.
		Parameters:
			text 		String
			x,y 		Starting x and y coordinates of the first character. Note that
						this point refers to the bottom left of the first character.
			fontSize 	The font size of the text generated.
			fontWeight 	The weight of the font (regular, bold, etc.)
			textColor 	The color of the text.
		Return: A string that can be placed inside an SVG.
	*/
	static #generateTextElement(text, x, y, fontSize, fontWeight, textColor){
		return '<text x="' + x
		+ '" y="' + y
		+ '" font-family="consolas" '
		+ 'font-size="' +fontSize
		+ '" dominant-baseline="middle" '
		+ 'style="fill:' +textColor
		+ ';font-weight:' + fontWeight + '">' + this.#sanitizeHTML(text) + '</text>';
	}

	static #sanitizeHTML(text) {
		var element = document.createElement('div');
		element.innerText = text;
		return element.innerHTML;
	}

	/*
		generateTitleText(text, x, y)
		Description:
		Generates a string to be placed into another SVG element. Generates
		multiple text elements and arranges them in a way so that it may fit
		inside the designated title box.
		Parameters:
			text 		String
			x,y 		x and y coordinates of the first character of the title
						Note that I have modified the standard, and made these
						coordinates point to the top left of the first character
						which is different than the SVG standard.
		Return: A string that can be placed inside an SVG.
		Note: 
		This function is intended for title or variable and as such makes a few
		assumptions: Consolas, bold, 20pt. => 11*23.2 for each char. Due to
		overlapping vertically, the chars can be assumed to be 15 pixels tall.
	*/
	static #generateTitleText(text, x, y){
		text = text.toString();

		var titleText = "";
		var row = 1;

		var maxchars = Math.floor(this.#MAX_WIDTH / 11);
		var re = new RegExp(`.{1,${maxchars}}`,"g");
		var blocks = text.toString().match(re);

		for (const block of blocks){
			titleText = titleText
			+ this.#generateTextElement(block, x, y + (15 * row++) - 4, 20, "bold", "black");
		}
		return titleText;
	}

	/*
		generateText(text, x, y)
		Description:
		Generates a string to be placed into another SVG element. Generates
		multiple text elements and arranges them in a way so that it may fit
		inside the designated title box.
		Parameters:
			text 		String
			x,y 		x and y coordinates of the first character of the title
						Note that I have modified the standard, and made these
						coordinates point to the top left of the first character
						which is different than the SVG standard.
		Return: A string that can be placed inside an SVG.
		Note: 
		This function is intended for title or variable and as such makes a few
		assumptions: Consolas, regular, 20pt. => 11*23.2 for each char. Due to
		overlapping vertically, the chars can be assumed to be 15 pixels tall.
		This function is used for regular text as opposed to title text which is
		bold.
	*/
	static #generateText(text, x, y){
		text = text.toString();
		var titleText = "";
		var row = 1;

		var maxchars = Math.floor(this.#MAX_WIDTH / 11);
		var re = new RegExp(`.{1,${maxchars}}`,"g");
		var blocks = text.toString().match(re);

		for (const block of blocks){
			titleText = titleText
			+ this.#generateTextElement(block, x, y + (15 * row++) - 4, 20, "regular", "black");
		}
		return titleText;
	}

	static #generateErrorText(text, x, y){
		var titleText = "";
		var row = 1;

		var maxchars = Math.floor(this.#ERROR_WIDTH / 11);
		var re = new RegExp(`.{1,${maxchars}}`,"g");
		var blocks = text.toString().match(re);

		for (const block of blocks){
			titleText = titleText
			+ this.#generateTextElement(block, x, y + (15 * row++) - 4, 20, "bold", "black");
		}
		return titleText;
	}

	// Image Generating Functions

	static GenerateErrorNode(exception_message){
		var width = Math.min(Math.ceil(11 * exception_message.length), this.#ERROR_WIDTH);
		var height = 15 * Math.ceil(11 * exception_message.length / this.#ERROR_WIDTH);

		var finalWidth = width + 10 + 2;
		var finalHeight = height + 10 + 2;

		var svgString = `
<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}"
	version="1.1" xmlns="http://www.w3.org/2000/svg">
	<rect x="1" y="1" width="${width + 10}" height="${height + 10}" style="fill:#fadcdc" stroke-width="1px" stroke="#d88f90" />
	${this.#generateErrorText(exception_message, 10, 5)}
</svg>`;

	return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgString)),"width":finalWidth,"height":finalHeight};
	}

	/*
		GenerateClassNode(minWidth, minHeight, className, div1Height)
		Description:
		Generates an SVG representing a class node that can be used as an image source.
		This function is used in the class view probably.
		Parameters:
			minWidth 		The minimum width of the body component.
							i.e. how wide can this element be at LEAST. (=> can be wider)
			minHeight 		The minimum height of the body component.
							i.e. how tall can this element be at LEAST. (=> can be wider)
			className 		The name of the class.
			div1Height 		The height of the first division within the body.
		Return: {"svgString":<SVG image data>, "width":<final_width>, "height":<final_height>}
		Note:
		The body and the header heights are calculated seperately. What is returned is the sum
		of heights of these two components.
	*/
	static GenerateClassNode(minWidth, minHeight, className, div1Height){
		className = className.toString();
		var textDimension = this.#getTextDimensions(className);
		var width = textDimension.width;
		var height = textDimension.height;
		var divisionY = height + 17 + div1Height

		var finalHeight = height + 17 + minHeight + 2;
		var finalWidth = Math.max(minWidth, width + 20) + 2;

		var svgString = `
<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
	version="1.1" xmlns="http://www.w3.org/2000/svg">
	<path d="M11 1 h${width} l10 10 v${height + 10} h-${width + 20} v-${height + 10} Z" 
		style="fill: ${this.#ClassNameBlock}" stroke="${this.#ClassStroke}" stroke-width="1px" />
	${this.#generateTitleText(className, 10, 5)}
	<path d="M1 ${height + 14} h${minWidth - 20} l20 20 v${minHeight - 20} h-${minWidth} Z" 
		style="fill: ${this.#ClassBody}" stroke="${this.#ClassStroke}" stroke-width="1px" />
	<path d="M1 ${divisionY} h${minWidth}" stroke="${this.#ClassStroke}" stroke-width="1px"/>
	<g transform="translate(12 ${height + 17 + 12}) scale(0.06)">
		<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" stroke="#000" fill="none">
			<path stroke-width="26" d="M209,15a195,195 0 1,0 2,0z"/>
			<path stroke-width="18" d="m210,15v390m195-195H15M59,90a260,260 0 0,0 302,0 m0,240 a260,260 0 0,0-302,0M195,20a250,250 0 0,0 0,382 m30,0 a250,250 0 0,0 0-382"/>
		</svg>
	</g>
	<g transform="translate(12 ${divisionY + 5}) scale(0.06)">
		<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" 
			xmlns="http://www.w3.org/2000/svg" width="512" height="512" version="1.1" id="svg2">
			<g transform="translate(0,448)">
				<path style="fill:#000000;fill-opacity:1;stroke:#000000;stroke-width:12;stroke-linecap:butt;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" 
					d="m 16,256 240,-192 96,72 0,-32 48,0 0,72 96,80 -48,0 0,192 -120,0 0,-160 -96,0 0,160 -168,0 0,-192 z" transform="translate(0,-448)"/>
			</g>
 		</svg>
	</g>
</svg>`;
		return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgString)),"width":finalWidth,"height":finalHeight};
	}

	/*
		GenerateClassInstanceNode(minWidth, minHeight, InstanceName)
		Description:
		Generates an SVG representing a class instance that can be used as an image source.
		Parameters:
			minWidth 		The minimum width of the body component.
							i.e. how wide can this element be at LEAST. (=> can be wider)
			minHeight 		The minimum height of the body component.
							i.e. how tall can this element be at LEAST. (=> can be wider)
			InstanceName	The name of the instance.		
		Return: {"svgString":<SVG image data>, "width":<final_width>, "height":<final_height>}
		Note:
		The body and the header heights are calculated seperately. What is returned is the sum
		of heights of these two components.
	*/
	static GenerateClassInstanceHeadNode(InstanceName){
		InstanceName = InstanceName.toString();
		var textDimension = this.#getTextDimensions(InstanceName);
		var width = textDimension.width;
		var height = textDimension.height;
		
		var finalHeight = height + 17;
		var finalWidth =  width + 23;
		
		var svgString = `
		<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
		version="1.1" xmlns="http://www.w3.org/2000/svg">
		<path d="M11 1 h${width} l10 10 v${height + 10} h-${width + 20} v-${height + 10} Z" 
			style="fill: ${this.#ClassNameBlock}" stroke="${this.#ClassStroke}" stroke-width="1px" />
			${this.#generateTitleText(InstanceName, 12, 5)}
		</svg>`;

		// with 3 dots on the left
		// var svgString = `
		// <svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
		// version="1.1" xmlns="http://www.w3.org/2000/svg">
		// <path d="M21 1 h${width} l10 10 v${height + 10} h-${width + 20} v-${height + 10} Z" 
		// 	style="fill: ${this.#ClassNameBlock}" stroke="${this.#ClassStroke}" stroke-width="1px" />
		// 	${this.#generateTitleText(InstanceName, 20, 5)}
		// <rect x="1" y="11" width="10" height="${height + 5}" rx="2" 
		// 	style="fill:${this.#ClassStroke}" stroke="${this.#ClassStroke}" stroke-width="1px"/>
		// 	<circle cx="6" cy="${Math.floor((height + 5) / 2) + 5 }" r="1.3" style="fill:white"/>
		// 	<circle cx="6" cy="${Math.floor((height + 5) / 2) + 10}" r="1.3" style="fill:white"/>
		// 	<circle cx="6" cy="${Math.floor((height + 5) / 2) + 15}" r="1.3" style="fill:white"/>
		// </svg>`;
		
		return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgString)),"width":finalWidth,"height":finalHeight};

		/*
		var finalHeight = height + 17 + minHeight;
		var finalWidth = Math.max(minWidth, width + 20) + 3;
		
		var svgString = `
<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
	version="1.1" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 1 h${width} l10 10 v${height + 10} h-${width + 20} v-${height + 10} Z" 
  	style="fill: ${this.#ClassNameBlock}" stroke="${this.#ClassStroke}" stroke-width="1px" />
  ${this.#generateTitleText(InstanceName, 20, 5)}
  <rect x="1" y="11" width="10" height="${height + 5}" rx="2" 
  	style="fill:${this.#ClassStroke}" stroke="${this.#ClassStroke}" stroke-width="1px"/>
	<circle cx="6" cy="${Math.floor((height + 5) / 2) + 5 }" r="1.3" style="fill:white"/>
	<circle cx="6" cy="${Math.floor((height + 5) / 2) + 10}" r="1.3" style="fill:white"/>
	<circle cx="6" cy="${Math.floor((height + 5) / 2) + 15}" r="1.3" style="fill:white"/>
	<path d="M1 ${height + 14} h${minWidth - 20} l20 20 v${minHeight - 20} h-${minWidth} Z" 
  		style="fill: ${this.#ClassBody}" stroke="${this.#ClassStroke}" stroke-width="1px" />
</svg>`;
		*/
		
	}
	static GenerateClassInstanceBodyNode(minHeight,minWidth){
		minWidth = minWidth + 20;
		var svgString = `
	<svg width="${minWidth}" height="${minHeight}" viewbox="0 0 ${minWidth} ${minHeight}" 
	version="1.1" xmlns="http://www.w3.org/2000/svg">
		<path d="M1 0 h${minWidth - 21} l20 20 v${minHeight - 20} h-${minWidth} Z" 
		style="fill: ${this.#ClassBody}" stroke="${this.#ClassStroke}" stroke-width="1px" />
	</svg>`;
		return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgString)),"width":minWidth,"height":minHeight};
	}
	/*
		GenerateClassHeadNode(className)
		Description:
		Generates an SVG representing a class head that can be used as an image source.
		Parameters:
			className 		The name of the class, the text to be put into the header box.
		Return: {"svgString":<SVG image data>, "width":<final_width>, "height":<final_height>}
	*/

	static GenerateClassHeadNode(className){
		className = className.toString();
		var textDimension = this.#getTextDimensions(className);
		var width = textDimension.width;
		var height = textDimension.height;

		var finalHeight = height + 10 + 2;
		var finalWidth = width + 22;

		var svgString = `
<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
	version="1.1" xmlns="http://www.w3.org/2000/svg">
	<path d="M11 1 h${width} l10 10 v${height} h-${width + 20} v-${height} Z" 
		style="fill: ${this.#ClassNameBlock}" stroke="${this.#ClassStroke}" stroke-width="1px" />
	${this.#generateTitleText(className, 10, 5)}
</svg>`;
		return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgString)),"width":finalWidth,"height":finalHeight};
	}

	/*
		GenerateClassBody(minWidth, minHeight)
		Description:
		Generates an SVG of the class body ONLY. This is to facilitate collapsability.
		Meant to be used in conjunction with the GenerateClassHeadNode function to create
		the facade of a full class instance node.
		Parameters:
			minWidth 		The width of the body
			minHeight 		The height of the body
		Return: {"svgString":<SVG image data>, "width":<final_width>, "height":<final_height>}
	*/
	static GenerateClassBody(minWidth, minHeight){
		var finalWidth  = minWidth + 2;
		var finalHeight = minHeight + 2;

		var svgString = `
<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
	version="1.1" xmlns="http://www.w3.org/2000/svg">
	<path d="M1 1 h${minWidth - 20} l20 20 v${minHeight - 20} h-${minWidth} Z" 
  		style="fill: ${this.#ClassBody}" stroke="${this.#ClassStroke}" stroke-width="1px" />
</svg>`;
		return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgString)),"width":finalWidth,"height":finalHeight};
	}

	/*
		GenerateFunctionCallNode(minWidth, minHeight, functionName)
		Description:
		Generates an SVG representing a function call that can be used as an image source.
		Parameters:
			minWidth 		The minimum width of the body component.
							i.e. how wide can this element be at LEAST. (=> can be wider)
			minHeight 		The minimum height of the body component.
							i.e. how tall can this element be at LEAST. (=> can be wider)
			functionName	The name of the function.		
		Return: {"svgString":<SVG image data>, "width":<final_width>, "height":<final_height>}
		Note:
		The body and the header heights are calculated seperately. What is returned is the sum
		of heights of these two components.
	*/
	static GenerateFunctionCallNode(minWidth, minHeight, functionName){
		functionName = functionName.toString();
		var textDimension = this.#getTextDimensions(functionName);
		var width = textDimension.width;
		var height = textDimension.height;

		var finalHeight = height + 10 + minHeight + 2;
		var finalWidth = Math.max(minWidth, width + 10) + 2;

		var svgString = `
<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
	version="1.1" xmlns="http://www.w3.org/2000/svg">
	<rect x="1" y="1" width="10" height="${height + 10}" rx="2" 
		style="fill:${this.#FunctionStroke}" stroke="${this.#FunctionStroke}" stroke-width="1" />
	<circle cx="6" cy="${Math.floor((height + 10) / 2) - 5 }" r="1.3" style="fill:white"/>
	<circle cx="6" cy="${Math.floor((height + 10) / 2) }" r="1.3" style="fill:white"/>
	<circle cx="6" cy="${Math.floor((height + 10) / 2) + 5}" r="1.3" style="fill:white"/>
	<rect x="11" y="1" width="${width + 10}" height="${height + 10}" rx="2" 
		style="fill:${this.#FunctionNameBlock}" stroke="${this.#FunctionStroke}" stroke-width="1" />
	${this.#generateTitleText(functionName, 15, 5)}
	<path d="M1 ${height + 10} h${minWidth-20} c20 0, 20 0, 20 20 v${minHeight - 20} h-${minWidth-20} c-20 0, -20 0, -20 -20 Z" 
		style="fill: ${this.#FunctionBody}" stroke="${this.#FunctionStroke}" stroke-width="1px" />
</svg>`;
		return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgString)),"width":finalWidth,"height":finalHeight};
	}

	/*
		GenerateFunctionHeadNode(FunctionName)
		Description:
		Generates an SVG representing a function head that can be used as an image source.
		Parameters:
			functionName 		The name of the class, the text to be put into the header box.
		Return: {"svgString":<SVG image data>, "width":<final_width>, "height":<final_height>}
	*/
	static GenerateFunctionHeadNode(functionName){
		functionName = functionName.toString();
		var textDimension = this.#getTextDimensions(functionName);
		var width = textDimension.width;
		var height = textDimension.height;

		var finalHeight = height + 12;
		var finalWidth = width + 12;

		var svgString = `
<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
	version="1.1" xmlns="http://www.w3.org/2000/svg">
	<path d="M1 1 h${width-10} c20 0, 20 0, 20 20 v${height - 10} h-${width-10} c-20 0, -20 0, -20 -20 Z" 
		style="fill: ${this.#FunctionNameBlock}" stroke="${this.#FunctionStroke}" stroke-width="1px" />
	${this.#generateTitleText(functionName, 5, 5)}
</svg>`;
		return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgString)),"width":finalWidth,"height":finalHeight};
	}

	/*
		GenerateFunctionBodyNode(minWidth, minHeight)
		Description:
		Generates an SVG of the function body ONLY. This is to facilitate collapsability.
		Meant to be used in conjunction with the GenerateClassHeadNode function to create
		the facade of a full function instance node.
	*/
	static GenerateFunctionBodyNode(minWidth, minHeight){
		var finalWidth  = minWidth + 2;
		var finalHeight = minHeight + 2;

		var svgString = `
<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
	version="1.1" xmlns="http://www.w3.org/2000/svg">
	<path d="M1 1 h${minWidth-20} c20 0, 20 0, 20 20 v${minHeight - 20} h-${minWidth-20} c-20 0, -20 0, -20 -20 Z" 
		style="fill: ${this.#FunctionBody}" stroke="${this.#FunctionStroke}" stroke-width="1px" />
</svg>`;
		return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgString)),"width":finalWidth,"height":finalHeight};
	}

	/*
		GenerateVariableNode(variableName, value="")
		Description:
		Generates an SVG representing a variable that can be used as an image source.
		Parameters:
			variableName 		The name of the variable, the contents of the leftmost box
			value 				If this exists, another box will be added to the right and
								the value of this parameter added.
	*/
	static GenerateVariableNode(variableName, value="" , returnFlag = 0){
		var bgColor,strokeColor;
		if (returnFlag)
		{
			bgColor = this.#HeapBody ;
			strokeColor = this.#HeapStroke;
		}
		else
		{
			bgColor = this.#VariableBody;
			strokeColor = this.#VariableStroke;
		}
		variableName = variableName.toString();
		if (value == null) value = "";
		value = value.toString();
		var nameDimension = this.#getTextDimensions(variableName);
		var nameWidth = nameDimension.width;
		var nameHeight = nameDimension.height;

		if( value == 'NaN') value = "";
		var valueDimension = this.#getTextDimensions(value);
		var valueWidth = valueDimension.width;
		var valueHeight = valueDimension.height;
		var finalHeight = Math.max(nameHeight, valueHeight) + 12;
		var finalWidth = nameWidth + valueWidth + 10 + 10 + 10 + 2;
		if(value != ""){
			var valueRectangle = `
	<rect x="${21+nameWidth}" y="1" width="${valueWidth + 10}" height="${finalHeight-2}" 
		style="fill:${bgColor}" stroke="${strokeColor}" stroke-width="1" />`;
			var valueText = this.#generateText(value, 26 + nameWidth, 5);
		} else {
			var valueRectangle = "";
			var valueText = "";
		}

		var svgString = `
<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
	version="1.1" xmlns="http://www.w3.org/2000/svg">
	<rect x="1" y="1" width="10" height="${finalHeight-2}" rx="2" 
		style="fill:${strokeColor}" stroke="${strokeColor}" stroke-width="1" />
	<circle cx="6" cy="${Math.floor(finalHeight / 2) - 5 }" r="1.3" style="fill:white"/>
	<circle cx="6" cy="${Math.floor(finalHeight / 2) }" r="1.3" style="fill:white"/>
	<circle cx="6" cy="${Math.floor(finalHeight / 2) + 5}" r="1.3" style="fill:white"/>
	<rect x="11" y="1" width="${nameWidth + 10}" height="${finalHeight-2}" 
		style="fill:${bgColor}" stroke="${strokeColor}" stroke-width="1" />
	${this.#generateTitleText(variableName, 15, 5)}
	${valueRectangle}
	${valueText}
</svg>`;
		/*
		if(value != ""){
			var valueRectangle = `
	<rect x="${21+nameWidth}" y="1" width="${valueWidth + 10}" height="${finalHeight-2}" 
		style="fill:${this.#VariableBody}" stroke="${this.#VariableStroke}" stroke-width="1" />`;
			var valueText = this.#generateText(value, 26 + nameWidth, 5);
		} else {
			var valueRectangle = "";
			var valueText = "";
		}

		var svgString = `
<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
	version="1.1" xmlns="http://www.w3.org/2000/svg">
	<rect x="1" y="1" width="10" height="${finalHeight-2}" rx="2" 
		style="fill:${this.#VariableStroke}" stroke="${this.#VariableStroke}" stroke-width="1" />
	<circle cx="6" cy="${Math.floor(finalHeight / 2) - 5 }" r="1.3" style="fill:white"/>
	<circle cx="6" cy="${Math.floor(finalHeight / 2) }" r="1.3" style="fill:white"/>
	<circle cx="6" cy="${Math.floor(finalHeight / 2) + 5}" r="1.3" style="fill:white"/>
	<rect x="11" y="1" width="${nameWidth + 10}" height="${finalHeight-2}" 
		style="fill:${this.#VariableBody}" stroke="${this.#VariableStroke}" stroke-width="1" />
	${this.#generateTitleText(variableName, 15, 5)}
	${valueRectangle}
	${valueText}
</svg>`;
	*/
		return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgString)),"width":finalWidth,"height":finalHeight};
	}

	/*
		GenerateHeapNode(variableName, value="")
		Description:
		Generates an SVG representing a Heap variable that can be used as an image source.
		Parameters:
			variableName 		The name of the variable, the contents of the leftmost box
			value 				If this exists, another box will be added to the right and
								the value of this parameter added.
	*/
	static GenerateHeapNode(variableName, value=""){
		variableName = variableName.toString();
		if (value == null) value = "";
		value = value.toString();
		var nameDimension = this.#getTextDimensions(variableName);
		var nameWidth = nameDimension.width;
		var nameHeight = nameDimension.height;

		if( value == 'NaN') value = "";
		var valueDimension = this.#getTextDimensions(value);
		var valueWidth = valueDimension.width;
		var valueHeight = valueDimension.height;
		var finalHeight = Math.max(nameHeight, valueHeight) + 12;
		var finalWidth = nameWidth + valueWidth + 10 + 10 + 10 + 2;

		if(value != ""){
			var valueRectangle = `
	<rect x="${21+nameWidth}" y="1" width="${valueWidth + 10}" height="${finalHeight-2}" 
		style="fill:${this.#HeapBody}" stroke="${this.#HeapStroke}" stroke-width="1" />`;
			var valueText = this.#generateText(value, 26 + nameWidth, 5);
		} else {
			var valueRectangle = "";
			var valueText = "";
		}

		var svgString = `
<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
	version="1.1" xmlns="http://www.w3.org/2000/svg">
	<rect x="1" y="1" width="10" height="${finalHeight-2}" rx="2" 
		style="fill:${this.#HeapDots}" stroke="${this.#HeapStroke}" stroke-width="1" />
	<circle cx="6" cy="${Math.floor(finalHeight / 2) - 5 }" r="1.3" style="fill:white"/>
	<circle cx="6" cy="${Math.floor(finalHeight / 2) }" r="1.3" style="fill:white"/>
	<circle cx="6" cy="${Math.floor(finalHeight / 2) + 5}" r="1.3" style="fill:white"/>
	<rect x="11" y="1" width="${nameWidth + 10}" height="${finalHeight-2}" 
		style="fill:${this.#HeapBody}" stroke="${this.#HeapStroke}" stroke-width="1" />
	${this.#generateTitleText(variableName, 15, 5)}
	${valueRectangle}
	${valueText}
</svg>`;
		return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgString)),"width":finalWidth,"height":finalHeight};
	}

	// Natalie's Code Below, will refactor later

	// Utility Functions
	/*
		getSvgHeading(width,height,backgroundColor="white")
		Description:
		Generates an SVG heading line with sepcify width, height and background color
		Parameters:
			width 			Width of the SVG Image (including the viewbox)
			height			Height of the SVG Image (including the viewbox)
			backgroundColor	background color for the Image, default is white
	*/
	static getSvgHeading(width,height,backgroundColor="white")
	{
		return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" style="background-color:${backgroundColor}">`;
	}
	/*
		createTriangleIcon(dx,dy,orientation,width,degree,fillColor)
		Description:
		Generates an SVG heading line with sepcify width, height and background color
		Parameters:
			dy 			y padding from Top
			dx			x padding from Left
			orientation	points ( down, left,right and up), 
			width 		the width of the triangle (isosceles triangle)
			degree		degree of the triangle
			fillColor 	fillColor
	*/
	static createTriangleIcon(dx,dy,orientation,width,degree,fillColor)
	{
		var triangle = '<polygon class="triangle" ';
		
		var pt2X = width;
		var pt3X = width/2;
		var pt3Y = pt3X * Math.tan(degree*Math.PI/180);
		var center = {"x":((3*dx+pt2X+pt3X)/3).toFixed(3)*1,"y":((3*dy+pt3Y)/3).toFixed(3)*1};
		var points = 'points="'+dx+','+dy+' '+(pt2X+dx)+','+dy+' '+(pt3X+dx)+','+(pt3Y+dy)+'" style="fill:'+fillColor+'"/>';
		
		if(orientation == "d")
			return triangle+points;
		if (orientation == "l")
			return triangle+'transform="rotate('+90+','+center.x+','+center.y+')" '+points;
		if (orientation == "r")
			return triangle+'transform="rotate('+-90+','+center.x+','+center.y+')" '+points;
	}
	/*
		generateHeapHead(type,length)
		Description:
		Generates an SVG Heap Body Image
		Parameters:
			type			type of the Heap Object (DICT/LIST)
			length 			Size of the Heap
	*/
	static GenerateHeapHead(type,length)
	{
		var bbox = this.#getTextDimensions(type+"["+length+"]");
		// var downtriangle = this.createTriangleIcon(8,12,'d',15,60,this.#HeapStroke);
		var txt = this.#generateTextElement(type+"["+length+"]",15,18,15,"bold","black");
		// var glassIcon = '<path transform="translate('+(20+bbox.width)+',7)" x="106.5" height="20" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" d="m9.8,9.8a5.32,5.32 0 1,0-0.9,0.9l5.95,5.95m-3.15-4.1 3.85,3.85-0.91,0.91-4.2-4.2"/>';
		var rectWidth = 7+15+7+bbox.width+20; //dx+triangleWidth+dx+textWidth+dx+glassWidth;
		var rectHead = '<rect x="1" y="2" width="'+rectWidth+'" height="31" style="fill:'+this.#HeapHeadBg+';stroke:'+this.#HeapStroke+'; stroke-width:1"/>'
	
		var width = rectWidth+2;
		var height = 31 + 4 // height + stroke width
		var svgHeading = this.getSvgHeading(width,height);
		var svgEnding = '</svg>';
		
		return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgHeading+rectHead+txt+svgEnding)),"width":width,"height":height};
	}
	/*
		generateHeapBody(type,width,keys,values)
		Description:
		Generates an SVG Heap Body Image
		Parameters:
			type			type of the Heap Object (DICT/LIST)
			width 			Width of the SVG Image (including the viewbox)
			keys			Index /Key list of the Heap
	*/
	static GenerateHeapBody(type,width,keys)
	{
		var rectHeight = 0;
		width = width - 2;
		var key = (type == "LIST" || type == "TUPLE" ? "index":"key");
		var headingtxt1 = this.#generateTextElement(key,15,15,10,"normal",this.HeapTxt);
		var headingtxt2 = this.#generateTextElement("value",width/2+3,15,10,"normal",this.HeapTxt);
	
		rectHeight += 40;
		var indexTxt = ""
		var valueTxt = ""
	
		for (var i=0 ; i < keys.length;i++)
		{
			var textbox = this.GenerateHeapBodyValue(0,width,keys[i],i)
			if (textbox.svgString != "")
				indexTxt += '<g transform="translate('+textbox.x+','+textbox.y+')">'+textbox.svgString+'</g>'
		}
		rectHeight += (-14+25+25);
		rectHeight += 15 + 15;
		var rectBody = '<rect x="0" y="0" width="'+width+'" height="'+rectHeight+'" style="fill:'+this.HeapBodyBG+';stroke:'+this.#HeapStroke+'; stroke-width:1"/>'
	
		width = width+2;
		var height = rectHeight + 1 // height + stroke width
		var svgHeading = this.getSvgHeading(width,height);
		var groupTranslate = '<g transform="translate(1,0)">'
		var svgEnding = '</g></svg>';
	
		return {"bgImage":btoa(svgHeading+groupTranslate+rectBody+headingtxt1+headingtxt2+indexTxt+svgEnding),"width":width,"height":height};
	
	}
	/*
		GenerateHeapBodyValue(type,width,value,index)
		Description:
		Generates an SVG heading line with sepcify width, height and background color
		Parameters:
			type			Type of the txt ,Index or value
			width 			Width of the SVG Image (including the viewbox)
			value			value inside the Heap
			index			y position , index 0 or 1
	*/
	static GenerateHeapBodyValue(type,width,value,index)
	{
		var xpos = 15;
		var valueTxt = "";
		var ypos = -14+40+25*index;
		if (type == 1)
		{
			xpos = width/2;
			valueTxt += '<rect x="0" y="0" width="40" height="25" style="fill:white;stroke:'+this.#HeapStroke+'; stroke-width:1"/>'
		}
		valueTxt += this.#generateTextElement(value,5,14,10,"normal",this.HeapTxt);
		
		return {"svgString":valueTxt,"width":40,"height":25,"y":ypos,"x":xpos};
	}
	/*
		GenerateLoopBody(type,width,height)
		Description:
		Generates an SVG heading line with sepcify width, height and background color
		Parameters:
			type			Type of the txt ,Index or value
			width 			Width of the SVG Image (including the viewbox)
			value			value inside the Heap
			index			y position , index 0 or 1
	*/
	static GenerateLoopBody(type,iter,width,height)
	{
		width = Math.max(width,100);
		height = Math.max(height,50)
		var finalWidth = width+2;
		var finalHeight = height+2;
		
		var svgString = 
		`
		<svg width="${finalWidth}" height="${finalHeight}" viewBox="0 0 ${finalWidth} ${finalHeight}" style="background-color:${this.#FunctionBody}" version="1.1" xmlns="http://www.w3.org/2000/svg">
			<rect x="1" y="1" rx="5%" ry="5%" stroke="${this.#LoopStroke}" width="${width}" height="${height}" style="fill:${this.#LoopBody};stroke-width:1;stroke-dasharray:5" />
			<text x="${width - 3}" y="3" text-anchor="end" alignment-baseline="hanging" font-size="10" fill="${this.#LoopStroke}" style="font-weight:bold">Loop: ${type}</text>
			<text x="50%" y="${height - 2}" dominant-baseline="auto" text-anchor="middle" font-size="10" fill="${this.#LoopStroke}" style="font-weight:bold">Iteration: ${iter}</text>    
		</svg>`

		return {"svgString":encodeURI("data:image/svg+xml;base64," + btoa(svgString)),"width":finalWidth,"height":finalHeight};
	}
}