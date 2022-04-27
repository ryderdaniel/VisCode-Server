/*
	** Event Handler Functions
	NodeInteractor
	Description:
	This functions is the event handler of cytoscape
	1. show and Hide the Tippy 
	2. Change List Page 
	3. Redraw the List Page image
	
*/
var currTippy = null;

function hideTippy()
{
	if (currTippy == null)
		return;
	currTippy.hide();
	currTippy = null;
}

function showTippy(node)
{
		//cy.nodes().forEach(hideTippy);
		hideTippy();
		
		if (!node.data('tippy'))
		{	
			var domObject = document.createElement('div')
			var objtheme = '';
			if (node.data("group") == "VARIABLE_NODE" || node.data("group") == "PARAMETER_NODE")
			{
				objtheme = 'variable';
				var head = document.createElement('strong')
				if (node.parent().data("group") == "CLASS_NODE")
					head.innerHTML = 'Instance variable: ';
				else if (node.data("group") == "PARAMETER_NODE")
					head.innerHTML = 'Parameter: ';
				else
					head.innerHTML = 'Variable: ';
				domObject.appendChild(head);
				var typeValue = document.createElement('span')
				typeValue.innerHTML = node.data("type");
				domObject.appendChild(typeValue);
			}
			else if (node.data("group") == "RETURN_NODE")
			{
				objtheme = 'return';
				var head = document.createElement('strong')
				head.innerHTML = 'Return: ';
				domObject.appendChild(head);
				var typeValue = document.createElement('span')
				typeValue.innerHTML = node.data("type");
				domObject.appendChild(typeValue);
			}
			else if (node.data("group") == "FUNCTION_HEAD")
			{
				objtheme = 'function';
				var head = document.createElement('strong')
				if(node.parent().data("type") != undefined)
				{
					head.innerHTML = 'Method:';
					domObject.appendChild(head);
					var typeValue = document.createElement('div')
					typeValue.innerHTML = node.parent().data("type")+" class";
					domObject.appendChild(typeValue);
				}
				else
				{
					head.innerHTML = 'Function';
					domObject.appendChild(head);
				}
			}
			else{
				objtheme = 'class';
				var head = document.createElement('strong')
					head.innerHTML = 'Instance';
					domObject.appendChild(head);
				
			}
			var tippyobj = tippy( node.popperRef(), {
		        html: domObject,
		        trigger: 'manual',
				theme: objtheme,
		        arrow: true,
		        placement: 'left',
		        hideOnClick: false,
		        interactive: true,
	      });
			node.data('tippy',tippyobj.tooltips[0]);
		}
		
		node.data('tippy').show();
		currTippy = node.data('tippy');
		
		/*
		var dir = -1;
		var translateWidth = document.getElementsByClassName('tippy-tooltip')[0].clientWidth/2 * 1.25;
		var zoomratio = this.cy.zoom();
		var xdiff = document.getElementsByClassName('tippy-tooltip')[0].clientWidth/2 * (1-zoomratio) + dir*10*zoomratio;
		document.getElementsByClassName('tippy-tooltip')[0].style.setProperty("transform",`matrix(${zoomratio},0,0,${zoomratio},${xdiff},0)`);
		*/
	    return ; 
};
function addDictInfo(dictNode)
{
	if (dictNode.data("key").length > 0)
		return;
	
	var values = []
	var keys = []
	var entrySet = dictNode.data("value");
	
	for(var i=0;i<entrySet.length;i++)
	{
		if( !Array.isArray(entrySet[i]) || entrySet[i][0] == "REF")
			return;
		keys.push(entrySet[i][0]);
		values.push(entrySet[i][1]);
	}

	dictNode.data("key",keys)
	dictNode.data("value",values)
	
}
function changeListPage(node)
{
	var parentNode = node.parent();
	var dir = node.data("dir")
	var pageNumber = parentNode.data("page");
	var values = parentNode.data("value");
	pageNumber += dir;
	if (pageNumber < 0 || pageNumber*2+1 > values.length)
		return;
	drawListPage(parentNode,pageNumber)
	return;
}
function drawListPage(pnode,pageNumber)
{
	
	clearListReference(pnode);
	var bodyNode = pnode.children('.pageBody');
	
	if (bodyNode.length == 0) //HEAP_NODE Not yet generated
		return;
		
	var values = pnode.data("value");	
	
	var valueList = values.slice(pageNumber*2,pageNumber*2+2);
	var indexList = []
	if (pnode.data("type") == "DICT")
	{
		var keys = pnode.data("key")
		indexList = keys.slice(pageNumber*2,pageNumber*2+2);
	}
	else
	{
		indexList = [pageNumber*2]
		if (valueList.length == 2)
			indexList.push(pageNumber*2+1);
	}
	
	bodynodeImage = ElementComposer.GenerateHeapBody(pnode.data("type"),bodyNode.width(),indexList,valueList);
	bodyNode.style('background-image',encodeURI("data:image/svg+xml;base64," + bodynodeImage.bgImage));
	pnode.data("page",pageNumber);
	drawListValue(pnode,valueList);
	pnode.show();
	return;
}
function valueNodeReference(index,valueNode,heapId,edgeId,flag)
{
	var pNode = valueNode.parent();
	var heapNode = cy.nodes('#'+heapId);
	var valueEdge = cy.getElementById(edgeId);
	if (flag == 0) //Show
	{
		if (heapNode.data("visibility") == "INNER")
		{
			heapNode.position("x",pNode.position("x")+pNode.width()+100);
			sign = 1
			if (index == 0)
				sign = -1
			heapNode.position("y",pNode.position("y")+(sign)*pNode.height()/2);
		}
		
		if (!heapNode.visible())
		{
			heapNode.show();
			drawListPage(heapNode,0);
		}

		if (valueEdge.length == 0)
		{			
			var edge = cy.add(
				{ group: 'edges', data: { id: edgeId , source: valueNode.id(), target: heapId} }
				);
			edge.style("z-compound-depth","top");
			
			edge.style('width', 3);
			edge.style('target-arrow-shape','triangle');
			edge.style('target-arrow-color', '#767171');
			edge.style('line-color', '#767171');

			edge.style('source-endpoint', '-50% 0');
			edge.style('target-endpoint', '-50% 0');

			edge.style('curve-style', 'taxi');
			edge.style('taxi-direction', 'rightward');
			edge.style('taxi-turn', '60px');
		}
		else
			valueEdge.style("visibility", "visible");
		valueNode.data("Ref",heapId);
	}
	else //hide
	{
		if (heapNode.data("visibility") == "INNER")
		{	
			clearListReference(heapNode);
			heapNode.hide();
		}
		valueEdge.style("visibility", "hidden");
		valueNode.data("Ref","");
	}
}
function clearListReference(pnode)
{
	var valueNodes = pnode.children(".pageValue");
	var pageNumber = pnode.data("page");
	if (pageNumber == undefined)
		return;
	
	for(var i=0;i<valueNodes.length;i++)
	{
		var heapId = valueNodes[i].data("Ref");
		if (heapId != "" && heapId != undefined)
		{
			var edgeId = pnode.id()+'value_'+(2*pageNumber+i)+'&'+heapId
			valueNodeReference(i,valueNodes[i],heapId,edgeId,1);
		}
		valueNodes[i].hide();
	}
}
function drawListValue(pnode,valueList)
{
	var valueNodes = pnode.children(".pageValue");
	var pageNumber = pnode.data("page");
	
	for (var i=0;i<valueList.length;i++)
	{
		if (Array.isArray(valueList[i]))
		{
			var heapId = valueList[i][1]+'_HEAP';
			var edgeId = pnode.id()+'value_'+(2*pageNumber+i)+'&'+heapId
			valueNodeReference(i,valueNodes[i],heapId,edgeId,0);
			valueList[i] = "";
		}
		var valueImage = ElementComposer.GenerateHeapBodyValue(1,pnode.width(),valueList[i],0);
		var bto = btoa(ElementComposer.getSvgHeading(valueImage.width,valueImage.height,"#FFFFFF")+valueImage.svgString+"</svg>")
		valueNodes[i].style('background-image',encodeURI("data:image/svg+xml;base64," + bto));
		valueNodes[i].show();	
	}
}
/*
	NodeInteractor
	Description:
	This class will contain functions which facilitate the interactions
	with the cytoscape canvas, allowing for cleaner more modular code.

	The scope of functions to be included involve:
		* Node creation
		* Node deletion
		* Canvas "refreshing" (for now, purging and redrawing nodes)
		* Tippy event handling
		* Element expansion and collapse
		...
	Notes:
	To use this class, an object needs to be initiated and the cy object
	passed so that this class can handle everything to do with that object.
	In some regard, this can be considered an even more tailored API for
	the cytoscape canvas.
*/
class NodeInteractor {
	#step;		// The current step. The frame being inspected. Starts at 0.
	#maxFrame; 	// The maximum value step is allowed to be. I.e. 0 <= step <= maxFrame

	#childMap = {};	// Used to handle the order in which sizes are calculated
	#roots = [];	// Used to know which nodes are "root" nodes when thinking
					// about the structure of nodes like a tree.
	#edges = [];
	#errorExists = false;
	#errorMessage = "";

	// Used to map group IDs to functions.
	#generationMap = {
		'FUNCTION_BODY_NODE':this.#generate_FUNCTION_BODY_NODE,
		'FUNCTION_HEADER_NODE':this.#generate_FUNCTION_HEADER_NODE,
		'VARIABLE_NODE':this.#generate_VARIABLE_NODE,
		'CLASS_NODE':this.#generate_CLASS_NODE,
		'HEAP_NODE':this.#generate_HEAP_NODE,
		//'PARAMETER_NODE':this.#generate_PARAMETER_NODE,
		'PARAMETER_NODE':this.#generate_VARIABLE_NODE,
		'RETURN_NODE':this.#generate_RETURN_NODE,
		'LOOP_NODE':this.#generate_LOOP_NODE
	}; 	

	/*
		constructor(cy)
		Description:
		This function accepts the cytoscape object to work on. This
		is needed so that all future functions know which context
		they are working in.
		Parameters:
			cy 				The cytoscape object
			nodeJSON 		The nodeJSON object which contains the list of nodes and edges.
	*/
	constructor(cy, nodeJSON){
		this.cy = cy;
		this.nodeJSON = nodeJSON;
		this.#step = 0;
		this.#maxFrame = Object.keys(nodeJSON).length - 1;
		//this.#formatNodes();
		this.drawFrame(this.#step);
		this.#errorExists = "error" in nodeJSON;
		if (this.#errorExists){
			this.#errorMessage = nodeJSON["error"].exception_msg;
			//this.#maxFrame = this.#maxFrame + 1;
		}
		
		this.loopAnimation = eles => {
			var loopani = eles.animation
			(
				{
					style: {
						"line-dash-offset": 100
					}
				},
				{	
					duration: 5000,
					queue: true
				}
			);
			loopani.reverse().play().promise('complete').then(() => this.loopAnimation(eles))
		};

	}

	// Getters
	get step(){
		return this.#step;
	}

	get maxFrame(){
		return this.#maxFrame;
	}
	
	#positionNodes(){
		// todo - position nodes
		// console.log("********** Step " + this.#step + " **********");

		// Starting position
		const MAIN_START_X = 50, MAIN_START_Y = 40;
		const HEAP_START_X = 300;

		var mainCurrY = MAIN_START_Y; // keep track of the latest y position 
		var heapCurrY = MAIN_START_Y; // keep track of the latest heap y position

		var funcHeadX =  {} // keep track of FUNCTION_HEADER_NODE to align FUNCTION_BODY_NODE
 
		// Position spacing
		const SPACING_X = 7;
		const NODE_SPACING_Y = 9;
		const FUNC_SPACING_Y = 12; 
			
		// Position root nodes (e.g. function, heap, loop)
		var positionParentNode = root => {

			if (root.data("group") == "HEAP_NODE" && root.data("visibility") != "INNER")
			{
				var rootX = HEAP_START_X + root.data('width')/2, rootY = heapCurrY;
				
				// position heap node - center
				root.position("x", rootX);
				root.position("y", rootY);
				
				drawListPage(root,0);

				// format edges pointing to heap
				this.#formatHeapEdges(root.data('id'));

				// update current y position of heap nodes
				heapCurrY = rootY + root.data('height') + FUNC_SPACING_Y;
			}
			else if (root.data("group") =="CLASS_NODE") {
					
				var rootImage = ElementComposer.GenerateFunctionHeadNode(root.data("type"));

				// todo - fix shift after few steps?
				var rootX = HEAP_START_X + rootImage.width/2, rootY = heapCurrY;
				
				// position heap node - center
				root.position("x", rootX);
				root.position("y", rootY);

				// format edges pointing to class instance
				this.#formatClassEdges(root.data('id'));

				// position instance variable
				var bgNode = root.children('.body');

				if (bgNode.length != 0) {

					var childPosInfo = {"x": (bgNode.position("x") - bgNode.width()/2), "y": bgNode.position("y") - bgNode.height()/2+ NODE_SPACING_Y};

					this.#childMap[root.data("id")].forEach( (node) => {
					
						// position child node - center
						var width = node.width();
						var height = node.height();
						
						node.position("x", childPosInfo.x + width/2 + SPACING_X);
						node.position("y", childPosInfo.y + height/2);

						node.ungrabify();
						
						// update current position of child nodes inside root
						childPosInfo = {"x": childPosInfo.x, "y": node.position().y + node.height()/2 + NODE_SPACING_Y};
					});
				}

				// update current y position of heap nodes
				heapCurrY = rootY + root.data('height') + FUNC_SPACING_Y;
			}
			else if (root.data("group") == "FUNCTION_BODY_NODE" ) {

				// for getting width and height of function header
				var bodyNode = root.children('.body');
				var headNode = root.children('.head');

				var rootX = MAIN_START_X, rootY = mainCurrY; // top left

				// align x with its HEADER_NODE
				const FUNC_HEAD_X = funcHeadX[root.data('id')+'_FUNC_HEAD'];
				if (FUNC_HEAD_X)
					rootX = FUNC_HEAD_X + SPACING_X;
				
				// position function head and body node
				headNode.position("x", rootX + headNode.width()/2); 
				headNode.position("y", rootY + headNode.height()/2);

				bodyNode.position("x", headNode.position("x") - headNode.width()/2 + bodyNode.width()/2); 
				bodyNode.position("y", headNode.position("y") + headNode.height()/2 + bodyNode.height()/2);
				
				// format edges pointing to function
				this.#formatFuncEdges(root.data('id'));

				// update current position of root nodes
				mainCurrY = bodyNode.position("y") + bodyNode.height()/2  + FUNC_SPACING_Y;

				// starting position of child nodes
				var childPosInfo = {"x": (bodyNode.position("x") - bodyNode.width()/2), "y": bodyNode.position("y") - bodyNode.height()/2+ NODE_SPACING_Y};
				
				this.#childMap[root.data("id")].forEach( (node) => {
					
					// position child node - center
					var height, width;
					if (node.isParent()) // loop node
					{
						height = node.data('height');
						width = node.data('width');
					}
					else
					{
						width = node.width();
						height = node.height();
					}	
					node.position("x", childPosInfo.x + width/2 + SPACING_X);
					node.position("y", childPosInfo.y + height/2);

					if (node.data('group') == 'FUNCTION_HEADER_NODE')
						funcHeadX[node.data('id')] = childPosInfo.x + SPACING_X;

					if(node.isParent())
						positionParentNode(node);

					node.ungrabify();

					// update current position of child nodes inside root
					childPosInfo = {"x": childPosInfo.x, "y": node.position().y + node.height()/2 + NODE_SPACING_Y};
				});
				
			}		
			else if (root.data("group") == "LOOP_NODE" ) {

				var rootX = root.position().x;
				var rootY = root.position().y;
				var childY = rootY - root.data('height')/2 + NODE_SPACING_Y + 3;

				// Background of loop
				var bodyNode = root.children(".body");
				bodyNode.position("x",rootX);
				bodyNode.position("y",rootY);

				var zIndex = root.style('z-index');
				bodyNode.style('z-index',zIndex);
				bodyNode.ungrabify();

				this.#childMap[root.data("id")].forEach( (node) => {
					
					// position child node - center
					var width, height;
					if (node.isParent()) {// nested loop
						width = node.data("width");
						height = node.data("height");
					}
					else {
						width = node.width();
						height = node.height();
					}
									
					childY = childY + height/2;
					
					node.position("x", rootX - root.data("width")/2 + width/2 + SPACING_X);
					node.position("y", childY);

					if(node.isParent())
					{	
						node.style('z-index',zIndex+1);
						positionParentNode(node);
					}

					if (node.data('group') == 'FUNCTION_HEADER_NODE')
						funcHeadX[node.data('id')] = rootX - root.data('width')/2 + SPACING_X;

					node.ungrabify();
					childY = childY + height/2 + NODE_SPACING_Y;
				});
				root.position("x", rootX); 
				root.position("y", rootY);
			}
			
		};
		this.#roots.forEach(positionParentNode);
	} 
	/**
	 * style XXX edges
	 */
	#formatFuncEdges(nodeId){
		this.#edges.forEach(edge => {

			if (nodeId == edge.data('target')) {

				edge.style('width', 10);
				edge.style('target-arrow-shape','triangle');
				edge.style('target-arrow-color', '#FFC000');
				edge.style('line-color', '#FFC000');

				edge.style('source-endpoint', '-50% 0');
				edge.style('target-endpoint', '-50% 0');

				edge.style('curve-style', 'taxi');
				edge.style('taxi-direction', 'leftward');
				edge.style('taxi-turn', '60px');
				return;
			}
		});
	}
	#formatClassEdges(nodeId){
		this.#edges.forEach(edge => {

			if (nodeId == edge.data('target')) {

				edge.style('width', 3);
				edge.style('target-arrow-shape','triangle');
				edge.style('target-arrow-color', '#ED7D31');
				edge.style('line-color', '#ED7D31');

				edge.style('source-endpoint', '-50% 0');
				edge.style('target-endpoint', '-50% 0');

				edge.style('curve-style', 'taxi');
				edge.style('taxi-direction', 'rightward');
				edge.style('taxi-turn', '60px');
				return;
			}
		});
	}
	#formatHeapEdges(nodeId){
		this.#edges.forEach(edge => {

			if (nodeId == edge.data('target')) {
				
				edge.style('width', 3);
				edge.style('target-arrow-shape','triangle');
				edge.style('target-arrow-color', '#767171');
				edge.style('line-color', '#767171');

				edge.style('source-endpoint', '-50% 0');
				edge.style('target-endpoint', '-50% 0');

				edge.style('curve-style', 'taxi');
				edge.style('taxi-direction', 'rightward');
				edge.style('taxi-turn', '60px');

				// find class instance heap and direct edge to right
				// todo - still overlap as center pos used to cal instead of endpoint
				cy.nodes().forEach((node)=>{
					if (node.data('id') == edge.data('source')) {
						if (node.parent().data('group') == 'CLASS_NODE') {
							edge.style('source-endpoint', '50% 0');
							edge.style('target-endpoint', '50% 0');
						}
					}
				});
				return;
			}
		});
	}

	#addEvents(){
		this.cy.on('drag','node',function(evt){
			hideTippy();
		});
		this.cy.on('mouseover','node',function(evt){
			var ele = evt.target;
			if (ele != cy && ele.isNode())
			{
				switch (ele.data("group")){
				case "VARIABLE_NODE":
					showTippy(ele);
					break;
				case "PARAMETER_NODE":
					showTippy(ele);
					break;
				case "FUNCTION_HEAD":
					showTippy(ele);
					break;
				case "CLASS_HEAD":
					showTippy(ele);
					break
				case "RETURN_NODE":
					showTippy(ele);
				default:
					break;
				}
	
			}	
		});
		
		this.cy.on('mouseout','node',function(evt){
			hideTippy();
		});
		
		this.cy.on('zoom',function(evt){
			hideTippy();
		});
	}

	/*
		generate_XXX(node)
		Description:
		This function alters the node passed to it, changing its size, and appearance.
		Return: {"width":<node_width>, "height":<node_height>}
		Note:
		In the case of collapsable nodes, two nodes will be made. These will be made to
		be children of the node passed into the function. The head node that is created
		will have a click function which will hide the other node.
	*/
	#generate_FUNCTION_HEADER_NODE(node){
		var nodeImage = ElementComposer.GenerateFunctionHeadNode(node.data("label"));
		node.style('width', nodeImage.width);
		node.style('height', nodeImage.height);
		node.style('background-image', nodeImage.svgString);
		node.style('background-opacity', 0);
		node.style('z-index',5);
		return {"width":nodeImage.width, "height":nodeImage.height};
	}

	// This node is collapsable
	#generate_FUNCTION_BODY_NODE(node, minWidth, minHeight){
		// Generate function head node.
		var headNode = cy.add({
			group:'nodes',
			data:{ parent:node.id() , "group":"FUNCTION_HEAD"},
			position:{x:node.position('x'), y:node.position('y')}
		});

		var headImage = ElementComposer.GenerateFunctionHeadNode(node.data("label"));
		headNode.style('width', headImage.width);
		headNode.style('height', headImage.height);
		headNode.style('background-image', headImage.svgString);
		headNode.style('background-opacity', 0);
		headNode.addClass('head');
		headNode.ungrabify();

		if (minWidth < headImage.width)
			minWidth = headImage.width;

		// Generate function body node
		var bodyImage = ElementComposer.GenerateFunctionBodyNode(minWidth, minHeight);
		var y_position = node.position('y') + (headImage.height + bodyImage.height)/2 - 2;
		var x_position = node.position('x') + (bodyImage.width - headImage.width)/2
		var bodyNode = cy.add({
			group:'nodes',
			data:{ parent:node.id() },
			position:{x:x_position, y:y_position}
		});

		if (!isNaN(bodyImage.width)) {
			bodyNode.style('width', bodyImage.width);
			bodyNode.style('height', bodyImage.height);
		}
		else {
			bodyNode.style('width', 0);
			bodyNode.style('height', 0);
		}

		bodyNode.style('background-image', bodyImage.svgString);
		bodyNode.style('z-compound-depth', 'orphan');
		bodyNode.style('background-opacity', 0);
		bodyNode.addClass('body');
		bodyNode.ungrabify();

		// Add functionality to head
		headNode.on('tap', function(evt){
			var node = evt.target;
			var parentNode = node.parent()
			var hiddenChilds = parentNode.children(':hidden').difference(node);
			if (hiddenChilds.length > 0){
				hiddenChilds.forEach(n => n.show());
			} else{
				parentNode.children(':visible').difference(node).forEach(n => n.hide());
			}
		});

		var finalWidth = Math.max(headImage.width, bodyImage.width);
		var finalHeight = headImage.height + bodyImage.height + 2;

		// for positioning
		node.data('width', finalWidth);
		node.data('height', finalHeight);

		return {"width":finalWidth, "height":finalHeight};
	}
	#generate_LOOP_NODE(node,minWidth = 0,minHeight = 0){
		var bodyNode = cy.add({
			group:'nodes',
			data:{ parent:node.id() }
		});
		
		
		var nodeImage = ElementComposer.GenerateLoopBody(node.data("type"),node.data("value"),minWidth,minHeight);
		bodyNode.style('width', nodeImage.width);
		bodyNode.style('height', nodeImage.height);
		bodyNode.style('background-image', nodeImage.svgString);
		bodyNode.addClass('body');
		
		node.style('min-width', nodeImage.width);
	 	node.style('min-height', nodeImage.height);
		node.style('background-opacity', 0);
		
		node.data('width', nodeImage.width);
		node.data('height', nodeImage.height);
		if (node.data('event') == 'loop_back')
		{
			var edge = cy.add(
				{ group: 'edges', data: { source: bodyNode.id(), target: bodyNode.id() }, classes: 'loop'}
				);
		}
		return {"width":nodeImage.width, "height":nodeImage.height};
	}
	// #generate_FUNCTION_BODY_NODE(node, minWidth, minHeight){
	// 	var nodeImage = ElementComposer.GenerateFunctionCallNode(minWidth, minHeight, node.data("label"));
	// 	node.style('width', nodeImage.width);
	// 	node.style('height', nodeImage.height);
	// 	// These two are needed for parent nodes.
	// 	// See: https://js.cytoscape.org/#style/node-body
	// 	node.style('min-width', nodeImage.width);
	// 	node.style('min-height', nodeImage.height);
	// 	node.style('background-image', nodeImage.svgString);
	// 	return {"width":nodeImage.width, "height":nodeImage.height};
	// }

	#generate_VARIABLE_NODE(node){
		var nodeImage = ElementComposer.GenerateVariableNode(node.data("label"), node.data("value"));
		node.style('width', nodeImage.width);
		node.style('height', nodeImage.height);
		node.style('background-image', nodeImage.svgString);
		node.style('background-opacity', 0);
		node.style('z-compound-depth', 'top');
		return {"width":nodeImage.width, "height":nodeImage.height};
	}
	
	#generate_RETURN_NODE(node){
		var nodeImage = ElementComposer.GenerateVariableNode(node.data("label"), node.data("value"),1);
		node.style('width', nodeImage.width);
		node.style('height', nodeImage.height);
		node.style('background-image', nodeImage.svgString);
		node.style('background-opacity', 0);
		node.style('z-compound-depth', 'top');
		return {"width":nodeImage.width, "height":nodeImage.height};
	}
	// This node is collapsable
	#generate_CLASS_NODE(node, minWidth = 0, minHeight = 0){
		var headNode = cy.add({
				group:'nodes',
				data:{ parent:node.id() , "group":"CLASS_HEAD"},
				position:{x:node.position("x"), y:node.position("y")}
			});	 
		
	
		var nodeImage = ElementComposer.GenerateClassInstanceHeadNode(node.data("type"));
		headNode.style('width', nodeImage.width);
		headNode.style('height', nodeImage.height);
		headNode.style('background-image', nodeImage.svgString);
		headNode.style('background-opacity', 0);
		headNode.ungrabify();
		
		var nodeWidth = nodeImage.width;
		var nodeHeight = nodeImage.height;
		
		if (minHeight > 0)
		{
			
			var bodyImage = ElementComposer.GenerateClassInstanceBodyNode(minHeight,minWidth);
			var y_position = node.position('y') + (nodeImage.height + bodyImage.height)/2 - 2;
			var x_position = node.position('x') + (bodyImage.width - nodeImage.width)/2
			
			var bodyNode = cy.add({
				group:'nodes',
				data:{ parent:node.id() },
				position:{x:x_position, y:y_position}
			});
			
			bodyNode.style('width', bodyImage.width);
			bodyNode.style('height', bodyImage.height);
			bodyNode.style('background-image', bodyImage.svgString);
			bodyNode.style('background-opacity', 0);
			bodyNode.addClass('body');
			bodyNode.ungrabify();
			
			nodeWidth = Math.max(nodeImage.width,bodyImage.width);
			nodeHeight = nodeHeight+bodyImage.height;
			
			// Add functionality to head
			headNode.on('tap', function(evt){
				var node = evt.target;
				var parentNode = node.parent()
				var hiddenChilds = parentNode.children(':hidden').difference(node);
				if (hiddenChilds.length > 0){
					hiddenChilds.forEach(n => n.show());
				} else{
					parentNode.children(':visible').difference(node).forEach(n => n.hide());
				}
			});
		}
		
		node.data("width",nodeWidth);
		node.data("height",nodeHeight);
		
		return {"width":nodeImage.width, "height":nodeImage.height};
	}

	#generate_HEAP_NODE(pnode){
		/*
		var nodeImage = ElementComposer.GenerateHeapHead(node.data("type"),node.data("value").length);
		//var nodeImage = ElementComposer.GenerateHeapNode(node.data("label"), node.data("value"));
		node.style('width', nodeImage.width);
		node.style('height', nodeImage.height);
		node.style('background-image', nodeImage.svgString);
		node.style('background-opacity', 0);
		return {"width":nodeImage.width, "height":nodeImage.height};
		*/
	    var showFlag = pnode.visible();
		if (!showFlag)
			pnode.show();
		var headnode = cy.add({
			group: 'nodes',
			data: { parent:pnode.id()},
			position: { x: pnode.position("x"), y: pnode.position("y") }
		});
		
		var headnodeImage = ElementComposer.GenerateHeapHead(pnode.data("type"),pnode.data("value").length);
		headnode.style('width',headnodeImage.width);
		headnode.style('height',headnodeImage.height);
		headnode.style('background-image',headnodeImage.svgString);
		headnode.ungrabify();
		
		var xpos = headnode.position('x');
		var ypos = headnode.position('y') + headnode.height()/2;
		
		if (pnode.data("value").length == 0)
		{
			pnode.data("height",headnodeImage.height);
			pnode.data("width",headnodeImage.width);
			var visibility = pnode.data("visibility");
			if (visibility == "INNER" && !showFlag)
				pnode.hide();
				return;
		}
		var bodynodeImage = ElementComposer.GenerateHeapBody(pnode.data("type"),headnode.width(),[0,1]);
		ypos = ypos + bodynodeImage.height/2 -2;
		var bodynode = 
			cy.add({
				group: 'nodes',
				data: { parent:pnode.id()},
				position: { x: xpos, y: ypos }
			});
		bodynode.style('width',bodynodeImage.width);
		bodynode.style('height',bodynodeImage.height);
		bodynode.addClass("pageBody");
		bodynode.ungrabify();
		
		pnode.data("height",bodynodeImage.height+headnodeImage.height);
		pnode.data("width",bodynodeImage.width);
		
		var valueImage = ElementComposer.GenerateHeapBodyValue(1,headnode.width(),"",0);
	
		for(var i=0;i <2;i++)
		{
			var valueNode = 
			cy.add({
				group: 'nodes',
				data: { parent:pnode.id()},
				position: { x: xpos+(valueImage.width/2) , y: ypos-(bodynodeImage.height/2)+(valueImage.height/2)+(valueImage.y+24*i) }
			});
		
			valueNode.style('width',valueImage.width);
			valueNode.style('height',valueImage.height);
			valueNode.addClass("pageValue");
			valueNode.hide();
			valueNode.ungrabify();
		}
		
		ypos = ypos + (bodynode.height()-1)/2-15;
		var buttonSetting = [["l",-1],["r",1]]
		for (var i =0 ;i<buttonSetting.length;i++)
		{
			var btnNode = 
			cy.add({
				group: 'nodes',
				data: { dir:buttonSetting[i][1] , parent:pnode.id()},
				position: { x: (xpos+(buttonSetting[i][1]*bodynode.width()/2)-buttonSetting[i][1]*25), y: ypos }
			});
	
			var btnString = ElementComposer.createTriangleIcon(0,2,buttonSetting[i][0],10,60,ElementComposer.HeapTxt);
			var btnImage = btoa(ElementComposer.getSvgHeading(12,12,ElementComposer.HeapBodyBG)+btnString+"</svg>")
			btnNode.style('width',12);
			btnNode.style('height',12);
			btnNode.style('background-image',encodeURI("data:image/svg+xml;base64," + btnImage));
			btnNode.ungrabify();

			btnNode.on('tap',function(evt)
			{
				changeListPage(evt.target);
			});
		}
		
		headnode.on('tap',function(evt){
			var node = evt.target;
			var parentNode = node.parent()
			var hiddenChilds = parentNode.children(':hidden').difference(node);
			if (hiddenChilds.length > 0)
				hiddenChilds.forEach(n => n.show());
			else
				parentNode.children(':visible').difference(node).forEach(n => n.hide());
		});
	
		if(pnode.data("type")=="DICT")
		{
			addDictInfo(pnode);
		}
		var visibility = pnode.data("visibility");
		if (visibility == "INNER" && !showFlag)
			pnode.hide();
	}

	#generate_PARAMETER_NODE(node){
		return this.#generate_VARIABLE_NODE(node);
	}

	/*
		drawNodes(roots)
		Description:
		This is a recursive function that calls in post-order such that
		the size of the parent is calculated after all of the sizes of 
		the children have been calculated.
		Parameter:
			roots 		A node object representing the parent node.
			childMap 	A map, mapping parents to an array of children.
		Return: {"width":<child_width>, "height":<child_height>}
	*/
	#drawNodes(root){
		// Base case: Will always be a single parameter function.
		let children = this.#childMap[root.data("id")];
		if(children.length == 0){
			return this.#generationMap[root.data("group")](root);
		}

		var minHeight = 0; // will be the sum of heights of all children + 5px padding on each side
		var minWidth = 0; // Will be wider than the widest child by 10px

		// Operate on all children first.
		
		for(const node of children){
			let dimensions = this.#drawNodes(node);
			minHeight += dimensions.height + 10;
			minWidth = Math.max(minWidth, dimensions.width);
		}

		// Will always be a multi-parameter function
		return this.#generationMap[root.data("group")](root, minWidth + 10, minHeight + 10)
	}

	/*
		formatNodes()
		Description:
		This function will apply the background to the nodes in the current cy object.
		It will also handle calculation of the size of the nodes before applying the
		size, as to accomodate functions for example.

		For reference, with the current setup, this function assumes variables will be 
		stacked vertically.
	*/
	#formatNodes(){
		this.#roots.forEach((root)=>{
			this.#drawNodes(root);
		});
		
		this.#positionNodes();
		this.#addEvents();
	}

	#renderError(){
		this.drawFrame(this.#maxFrame-1);
		var errorNode = cy.add({
			group:'nodes',
			data:{ },
			position:{x:20, y:20}
		});
		var errorImage = ElementComposer.GenerateErrorNode(this.#errorMessage);
		errorNode.style('width', errorImage.width);
		errorNode.style('height', errorImage.height);
		errorNode.style('background-image', errorImage.svgString);
		errorNode.style('background-opacity', 0);
		errorNode.position("x", cy.width()/2);
		errorNode.position("y", cy.height()/2);
	}

	/*
		drawFrame(frameNumber)
		Description:
		This function softly refreshes the cytoscape canvas with the nodes and edges of
		a specific frame.
		Parameters:
			frameNumber 	The frame number (starts at 0)
		Note:
		If the frame number is invalid, i.e. is less than 0 or greater than the number of frames,
		the frame will not be updated.
	*/
	drawFrame(frameNumber){
		if(this.#errorExists && frameNumber == this.#maxFrame){
			this.#renderError();
			this.#step = frameNumber;
			return this.#step;
		}

		

		if(frameNumber < 0 || frameNumber > this.#maxFrame || (frameNumber == this.#step && frameNumber != 0) )
			return -1;
		//cy.elements().remove();cy.add( this.nodeJSON[frameNumber] );
	
		this.cy.json({ elements: this.nodeJSON[frameNumber] });
		this.#step = frameNumber;
		this.#childMap = {};
		this.#roots = [];
		this.#edges = [];
		let stdOut;
		if (this.nodeJSON[frameNumber].hasOwnProperty('stdout')){
			stdOut = this.nodeJSON[frameNumber].stdout;
		}
		cy.nodes().forEach((node)=>{
			this.#childMap[node.data("id")] = [];
			if (node.isParent())
			{
				this.#roots.push(node);
				var children = node.children().sort( function (n1,n2) { 
					if(n1.data("group") == "LOOP_NODE")
						return 1;
					if (n2.data("group") == "LOOP_NODE")
						return -1;
					return n1.data("order") - n2.data("order"); 
				})
				for(var i=0;i<children.length;i++)
					this.#childMap[node.data("id")].push(children[i])
			}
			else if (!node.isChild())
			{
				if(node.data("group") == "HEAP_NODE" && node.data("visibility") == "INNER")
					node.hide();
				this.#roots.push(node);
			}
				
		});

		cy.edges().forEach((edge)=>{
			this.#edges.push(edge);
		});
		
		this.#formatNodes();
		
		cy.edges('.loop').forEach( ele =>{
			this.loopAnimation(ele);
		});

		//Stdout handling
		const console = document.querySelector('#ConsoleOutput');
		console.innerHTML = stdOut;
		
		return this.#step;
	}

	prevFrame(){
		cy.edges('.loop').forEach( ele =>{
			ele.stop();
			ele.remove();
		});
		this.drawFrame(this.#step - 1);
	}

	nextFrame(){
		cy.edges('.loop').forEach( ele =>{
			ele.stop();
			ele.remove();
		});
		this.drawFrame(this.#step + 1);
	}

}