class ClassView {
        // Constants
    static #MAX_WIDTH = 200;
    static #TitleY    = 5; // The y coordinate of where text should begin

    // Colors

    // Function Colors
    static #FunctionNameBlock   = '#FFD966'; // text = black
    static #FunctionStroke      = '#FFC000';

    // Class Colors
    static #ClassNameBlock      = '#F4B183'; // text = black
    static #ClassBody           = '#FBE5D6';
    static #ClassStroke         = '#ED7D31';

    // Variable Colors
    static #VariableBody        = '#BDD7EE';
    static #VariableStroke      = '#4372C4';

    // Functions
	static #accessRightImage = { "Public": `
				<g transform=" scale(0.06)">
            <path stroke-width="26" style="stroke:#000" d="M209,15a195,195 0 1,0 2,0z"/>
            <path stroke-width="18" style="stroke:#000" d="m210,15v390m195-195H15M59,90a260,260 0 0,0 302,0 m0,240 a260,260 0 0,0-302,0M195,20a250,250 0 0,0 0,382 m30,0 a250,250 0 0,0 0-382"/>
			</g>` , 
			"Private": `
			<g transform="scale(0.06)translate(0,400)">
                <path style="fill:#000000;fill-opacity:1;stroke:#000000;stroke-width:12;stroke-linecap:butt;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" 
                    d="m 16,256 240,-192 96,72 0,-32 48,0 0,72 96,80 -48,0 0,192 -120,0 0,-160 -96,0 0,160 -168,0 0,-192 z" transform="translate(0,-448)"/>
            </g>`
			}
    //Internal Functions

    /*
        getTextDimensions(text):
        Description: 
        Calculates the Dimensions of a piece of text under the
        assumptions that the text is bold, 20pt, and Consolas.
        This function is used to obtain the dimension used in
        the name block of variables, functions and classes.
        Parameter:
            text        String
        Return: {"width":<text_width>, "height":<text_height>}
        Note: 
        The dimensions of a single consolas 20pt character 
        inside an SVG element is 11*23.2. Due to overlapping, the
        height of the text can be regarded as 15 pixels.
    */
	static #fontSizeMap = {
		20:[10.5,21.12],
		15:[8,17.28]
	}; 
	
    static #getTextDimensions(text,font = 20){
        //if(text == "") return {"width":0, "height":0};
		var width = Math.ceil(this.#fontSizeMap[font][0] * text.length);
		var height = this.#fontSizeMap[font][1]
		if (width > this.#MAX_WIDTH)
		{
			height = height * Math.ceil(width/this.#MAX_WIDTH);
		}
        width = Math.min(width, this.#MAX_WIDTH);
        //var height = 15 * Math.ceil(11 * text.length / this.#MAX_WIDTH) || 0;var height = this.#fontSizeMap[font][1];
        return {"width":width, "height":height};
    }

    /*
        generateTextElement(text,paddingLeft,centerY,fontSize,fontWeight,txtColor)
        Description:
        Generates an SVG text element to be used in the construction of other,
        larger SVG objects.
        Parameters:
            text        String
            x,y         Starting x and y coordinates of the first character. Note that
                        this point refers to the bottom left of the first character.
            fontSize    The font size of the text generated.
            fontWeight  The weight of the font (regular, bold, etc.)
            textColor   The color of the text.
        Return: A string that can be placed inside an SVG.
    */
    static #generateTextElement(text, x, y, fontSize, fontWeight, textColor, textAnchor = "start"){
		return '<text '
		+'text-anchor = "'+textAnchor+'" '
		+'x="' + x
        + '" y="' + y
        + '" font-family="consolas" '
        + 'font-size="' +fontSize
        + '" dominant-baseline="middle" '
        + 'style="fill:' +textColor
        + ';font-weight:' + fontWeight + '">' + text + '</text>';
    }

    /*
        generateTitleText(text, x, y)
        Description:
        Generates a string to be placed into another SVG element. Generates
        multiple text elements and arranges them in a way so that it may fit
        inside the designated title box.
        Parameters:
            text        String
            x,y         x and y coordinates of the first character of the title
                        Note that I have modified the standard, and made these
                        coordinates point to the top left of the first character
                        which is different than the SVG standard.
        Return: A string that can be placed inside an SVG.
        Note: 
        This function is intended for title or variable and as such makes a few
        assumptions: Consolas, bold, 20pt. => 11*23.2 for each char. Due to
        overlapping vertically, the chars can be assumed to be 15 pixels tall.
    */
    static #generateTitleText(text, x, y,font = 20,txtAnchor = "start",weight = "bold"){
        text = text.toString();

        var titleText = "";
        var row = 0;

        //var maxchars = Math.floor(this.#MAX_WIDTH / 11);
		var maxchars = Math.floor(this.#MAX_WIDTH / this.#fontSizeMap[font][0]);
        var re = new RegExp(`.{1,${maxchars}}`,"g");
        var blocks = text.toString().match(re);
		var ypadding = 3;
		var textHeight = this.#fontSizeMap[font][1];
	
        for (const block of blocks){
            titleText = titleText
			+ this.#generateTextElement(block, x, y + textHeight/2 +((textHeight+ ypadding) * row++), font, weight, "black",txtAnchor);
        }
        return titleText;
    }

    // Image Generating Functions

    /*
        GenerateClassNode(minWidth, minHeight, className, classItems)
        Description:
        Generates an SVG representing a class node that can be used as an image source.
        This function is used in the class view probably.
        Parameters:
            minWidth        The minimum width of the body component.
                            i.e. how wide can this element be at LEAST. (=> can be wider)
            minHeight       The minimum height of the body component.
                            i.e. how tall can this element be at LEAST. (=> can be wider)
            className       The name of the class.
            classItems      The list of all private, public and protected items within 
                            the class
        Return: {"svgString":<SVG image data>, "width":<final_width>, "height":<final_height>}
        Note:
        The body and the header heights are calculated seperately. What is returned is the sum
        of heights of these two components.
        Variable generation is implemented but not being used to maintain consistency between
        programming languages
    */
	static #GenerateClassBackgroundBlock(initialX,heights,labels,finalWidth)
	{
		
		var finalHeight = heights.reduce((a, b) => b + a, 0) + initialX;
		var bgsvgString = `
		<path d="M1 ${initialX + 14} h${finalWidth - 20} l20 20 v${finalHeight - 20} h-${finalWidth} Z" 
			style="fill: ${this.#ClassBody}" stroke="${this.#ClassStroke}" stroke-width="1px" />
		`
		var divisionY = initialX + 15;
		for (var i=0;i<heights.length;i++)
		{
			bgsvgString +=	`<g transform="translate(10 ${divisionY + 5})">`+
				this.#generateTextElement(labels[i],35,15,20,"bold","black") + this.#accessRightImage[labels[i]] + '</g>';
			if(i > 0)
			{	
				bgsvgString += `<path d="M1 ${divisionY} h${finalWidth}" stroke="${this.#ClassStroke}" stroke-width="1px"/>`;
			}
			divisionY += heights[i]
		}
		return bgsvgString;
	}
    static #GenerateClassNode(minWidth, minHeight, className, parents,classItems){
        className = className.toString();
		if (parents.length > 0)
			className = className + " ("+className[0].toString()+") "
        var textDimension = this.#getTextDimensions(className);
        var width = textDimension.width;
        var height = textDimension.height;

        // Draw the class items first to retrieve the final width and height
        // Public first, so that publicHeight can be calculated

        var itemHeights = [];
		var itemLabels = [];
        var itemSVGs = "";       // The SVGs of all items within this class

        // x and y positions of the SVG - x is basically constant
        var x = 12;         
        var yInitial = height + 17 + 12 + 30;     // Height of the public icon + 10
		
		for(var accessRight in classItems)
		{
			var blockheight = 50;
			
			for( var itemIdx of Object.keys(classItems[accessRight]))
			{
				var itemType = classItems[accessRight][itemIdx].type;
				var itemTitle = classItems[accessRight][itemIdx].title;
				var y = yInitial + blockheight; 
				var item;
				if (itemType == 'Function') {
					item = this.#GenerateFunctionHeadNode(x, y, itemTitle);
				}
				else if (itemType == 'Variable') {
					item = this.#GenerateVariableNode(x, y, itemTitle);
				}
				else {
					console.log('Error in generating Function node - item type undefined');
				}
				blockheight += item.height + 10;       // 2 px for padding

				// Update minWidth
				if (minWidth < item.width) {
					minWidth = item.width;
				}
				itemSVGs += atob(decodeURI(item.svgString));
			}
			if(blockheight > 50){
				itemHeights.push(blockheight);
				itemLabels.push(accessRight);
				yInitial = yInitial + blockheight;
			}
		}
		//Add default constructor to the class
		if (itemHeights.length == 0)
		{
			var blockheight = 50;
			var defaultFunc = ["Default Constructor","Default Destructor"];
			defaultFunc.forEach( (funcName) =>
			{
				item = this.#GenerateFunctionHeadNode(x, yInitial + blockheight, funcName);
				blockheight += item.height + 10; 
				itemSVGs += atob(decodeURI(item.svgString));
				if (minWidth < item.width) {
					minWidth = item.width;
				}
			});
			itemLabels.push("Private");
			itemHeights.push(blockheight);
		}
        var areaHeight = itemHeights.reduce((a, b) => b + a, 0);

        var finalHeight = height + Math.max(minHeight, areaHeight);
        var finalWidth = Math.max(minWidth, width + 20) + 22;
        
        // Self Note: Edited the path d = M1 from taking minHeight and minWidth to finalHeight and finalWidth
		 var svgString = `
		 <svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth + 5} ${finalHeight + 50} " 
    version="1.1" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path d="M11 1 h${width} l10 10 v${height + 10} h-${width + 20} v-${height + 10} Z" 
        style="fill: ${this.#ClassNameBlock}" stroke="${this.#ClassStroke}" stroke-width="1px" />
    ${this.#generateTitleText(className, 10, 10.5)}
	${this.#GenerateClassBackgroundBlock(height,itemHeights,itemLabels,finalWidth)}
	+${itemSVGs}+
	</svg>`;
		/*
         var svgString = `
<svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth } ${finalHeight + 30}" 
    version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 1 h${width} l10 10 v${height + 10} h-${width + 20} v-${height + 10} Z" 
        style="fill: ${this.#ClassNameBlock}" stroke="${this.#ClassStroke}" stroke-width="1px" />
    ${this.#generateTitleText(className, 10, 10.5)}
    <path d="M1 ${height + 14} h${finalWidth - 20} l20 20 v${finalHeight - 20} h-${finalWidth} Z" 
        style="fill: ${this.#ClassBody}" stroke="${this.#ClassStroke}" stroke-width="1px" />
    <path d="M1 ${divisionY} h${finalWidth}" stroke="${this.#ClassStroke}" stroke-width="1px"/>
    <g transform="translate(12 ${height + 17 + 12})">
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="25" fill="none">
			<g transform=" scale(0.06)">
            <path stroke-width="26" style="stroke:#000" d="M209,15a195,195 0 1,0 2,0z"/>
            <path stroke-width="18" style="stroke:#000" d="m210,15v390m195-195H15M59,90a260,260 0 0,0 302,0 m0,240 a260,260 0 0,0-302,0M195,20a250,250 0 0,0 0,382 m30,0 a250,250 0 0,0 0-382"/>
			</g>
			${this.#generateTextElement("Public",30,15,20,"normal","black")}
        </svg>
    </g>
    <g transform="translate(12 ${divisionY + 5})">
        <svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" 
            xmlns="http://www.w3.org/2000/svg" width="200" height="50" version="1.1" id="svg2">
            <g transform="scale(0.06)translate(0,448)">
                <path style="fill:#000000;fill-opacity:1;stroke:#000000;stroke-width:12;stroke-linecap:butt;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" 
                    d="m 16,256 240,-192 96,72 0,-32 48,0 0,72 96,80 -48,0 0,192 -120,0 0,-160 -96,0 0,160 -168,0 0,-192 z" transform="translate(0,-448)"/>
            </g>
			${this.#generateTextElement("Private",35,18,20,"normal","black")}
        </svg>
    </g>` + itemSVGs + `
</svg>`;*/
        return {"svgString":encodeURI(btoa(svgString)),"width":finalWidth,"height":finalHeight};
    }

    /*
        GenerateFunctionHeadNode(x, y, functionInfo)
        Description:
        Generates an SVG representing a function head that can be used as an image source.
        Parameters:
            x                   The x position of the SVG
            y                   The y position of the SVG
            functionInfo        The name of the class, the text to be put into the header box.
        Return: {"svgString":<SVG image data>, "width":<final_width>, "height":<final_height>}
    */
    static #GenerateFunctionHeadNode(x, y, functionInfo){
		var width, height, txtString;
		if (Array.isArray(functionInfo))
		{
			var functextDimension = this.#getTextDimensions(functionInfo[0].toString());
			var paramtextDimension = this.#getTextDimensions(functionInfo[1].toString(),15);
			var headwidth = functextDimension.width ;
			if (functextDimension.height > this.#fontSizeMap[20] || functextDimension.width + paramtextDimension.width > this.#MAX_WIDTH)
			{
				width = this.#MAX_WIDTH + 10
				height = functextDimension.height
				txtString = this.#generateTitleText(functionInfo[0].toString(), 10, 5.5);
				if (paramtextDimension.width > (this.#MAX_WIDTH-10))
				{
					
					var paramtxt = "("
					var currWidth = 0
					var currHeight = 0
					var currStartHeight = height + 10
					for( var param of functionInfo[1])
					{
						var paramSize = this.#getTextDimensions(param+",",15)
						if(currWidth + paramSize.width > (this.#MAX_WIDTH -10))
						{
							if(paramtxt.length > 1)
							{
								txtString += this.#generateTitleText(paramtxt, width +5 ,currStartHeight,15,"end");
								paramtxt = ""
							}
							paramtxt = paramtxt + param + ","
							currStartHeight += (5 + currHeight)
							currWidth = paramSize.width
							currHeight = paramSize.height
						}
						else
						{
							currWidth += paramSize.width
							paramtxt += param + ","
							currHeight = paramSize.height
						}
						console.log(currWidth+" "+paramSize.width+ " "+paramtxt);
					}
					if (paramtxt.length > 1)
						paramtxt = paramtxt.slice(0, -1)
					paramtxt += ")"
					txtString += this.#generateTitleText(paramtxt, width+5 ,currStartHeight,15,"end");
					height = currStartHeight + currHeight
					
				}
				else
				{
					//txtString += this.#generateTitleText("("+functionInfo[1].toString()+")", this.#MAX_WIDTH - paramtextDimension.width , 5.5 + this.#fontSizeMap[20][1]+5 , 15, "end");
					txtString += this.#generateTitleText("("+functionInfo[1].toString()+")", width + 5, 5.5 + this.#fontSizeMap[20][1]+5 , 15, "end");
					height = height + this.#fontSizeMap[15][1]
				}
					
			}
			else
			{
				width = functextDimension.width + paramtextDimension.width + 10 + 15
				height = functextDimension.height;
				//txtString = this.#generateTitleText(functionInfo[0].toString(), 10, 5.5) + this.#generateTitleText("("+functionInfo[1].toString()+")", 10+functextDimension.width+10, 8.5, 15)
				txtString = this.#generateTitleText(functionInfo[0].toString(), 10, 5.5) + this.#generateTitleText("("+functionInfo[1].toString()+")", width+ 10, 8.5, 15,"end")
			}
		}
		else	
		{
			functionInfo = functionInfo.toString();
			var textDimension = this.#getTextDimensions(functionInfo);
			width = 10 + textDimension.width ;
			height = textDimension.height;
			txtString = this.#generateTitleText(functionInfo, 10, 5.5)
		}
        var finalHeight = height + 12;
        var finalWidth =  width + 12;
        var svgString = `
<g transform = "translate(${x} ${y-50})">
    <svg width="${finalWidth}" height="${finalHeight}" viewbox="0 0 ${finalWidth} ${finalHeight}" 
    version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1 h${width-10} c20 0, 20 0, 20 20 v${height - 10} h-${width-10} c-20 0, -20 0, -20 -20 Z" 
        style="fill: ${this.#FunctionNameBlock}" stroke="${this.#FunctionStroke}" stroke-width="1.5px" />
    ${txtString}
    </svg>
</g>`;
        return {"svgString":encodeURI(btoa(svgString)),"width":finalWidth,"height":finalHeight};
    }

    /*
        GenerateVariableNode(x, y, variableInfo)
        Description:
        Generates an SVG representing a variable that can be used as an image source.
        Parameters:
            x                   The x position of the SVG
            y                   The y position of the SVG
            variableInfo        The name of the variable,  ': ', and type
    */
    static #GenerateVariableNode(x, y, variableInfo){
        var variableName = variableInfo[0].toString() +" : "+ variableInfo[1].toString();
		var nameDimension = this.#getTextDimensions(variableInfo[0]+" : ");
		var typeDimension = this.#getTextDimensions(variableInfo[1]);
		
		var finalWidth = nameDimension.width+ typeDimension.width+ 14
		var typeStarty = 5;
		if (finalWidth > this.#MAX_WIDTH)
		{
			finalWidth = this.#MAX_WIDTH;
			var finalHeight =  nameDimension.height + typeDimension.height+ 12;
			typeStarty = typeStarty+nameDimension.height;
		}
		else
			var finalHeight = nameDimension.height + 12;
		
        var svgString = `
<g transform = "translate(${x} ${y-50})">
    <svg width="${finalWidth+2}" height="${finalHeight}" viewbox="0 0 ${finalWidth+2} ${finalHeight}" 
        version="1.1" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="${finalWidth}" height="${finalHeight-2}"  rx="2" 
            style="fill:${this.#VariableBody}" stroke="${this.#VariableStroke}" stroke-width="1" />
        ${this.#generateTitleText(variableInfo[0]+" : ", 7, 5)}
		${this.#generateTitleText(variableInfo[1], finalWidth - 7 , typeStarty, 20,"end","normal")}
    </svg>
</g>`;

		
        return {"svgString":encodeURI(btoa(svgString)),"width":finalWidth,"height":finalHeight};
    }
    /* 
        Description:
        Generates the Class Diagram, containing the diagrams for all classes
        present in the user input code. For every class, the public variables
        and methods are first displayed, followed by the private counterparts.
    */

    static generateClassDiagram(stackTrace) {
        const PRIVATE = "Private", PUBLIC = "Public", PROTECTED = "Protected";
        const FUNCTION = "Function", VARIABLE = "Variable";

        var classDiagramSVGs = "";

        for (var className of Object.keys(stackTrace.class)) {
			
			var classMemberList = stackTrace.class[className].Member;
            var classFunctionList = stackTrace.class[className].FUNCTION;
			
			var parents = stackTrace.class[className].PARENT;
            var classItems = {};
            var publicItems = [], privateItems = [], protectedItems = [];
			
            for (var memberKey in classMemberList)
			{
				var member = classMemberList[memberKey];
				
                if (member.access_right == PUBLIC) {
                    publicItems.push({
                        title: [member.name,member.type],
                        type: VARIABLE,
                    })
                }
                else if (member.access_right == PRIVATE) {
                    privateItems.push({
                        title: [member.name,member.type],
                        type: VARIABLE,
                    })
                }
                else {
                    protectedItems.push({
                        title: [member.name,member.type],
                        type: VARIABLE,
                    })
                }
			}
            for (var funcKey in classFunctionList) {
                var func = classFunctionList[funcKey]
                var funcInfo = func.func_name + ' (' + func.parameter + ')';    // Text that goes on diagram
				
                if (func.access_right == PUBLIC) {
                    publicItems.push({
                        title: [func.func_name,func.parameter],
                        type: FUNCTION,
                    })
                }
                else if (func.access_right == PRIVATE) {
                    privateItems.push({
                        title: [func.func_name,func.parameter],
                        type: FUNCTION,
                    })
                }
                else {
                    protectedItems.push({
                        title: [func.func_name,func.parameter],
                        type: FUNCTION,
                    })
                }
            }

            classItems['Public'] = publicItems;
            classItems['Private'] = privateItems;
            classItems['Protected'] = protectedItems;

            var currClass = this.#GenerateClassNode(0, 0, className, parents,classItems);

            var classSVG = atob(decodeURI(currClass.svgString));
            
            classDiagramSVGs += classSVG;
        }


        // var svgElement = atob(decodeURI(ret.svgString.substring(26)));
        return classDiagramSVGs;
    }
}

module.exports = ClassView;