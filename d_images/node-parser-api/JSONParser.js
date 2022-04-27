class JSONParser {
	static generateNodeJSON(stackTrace){
		var nodeJson = {};

		// Node types
		const VARIABLE_NODE = 'VARIABLE_NODE', FUNCTION_BODY_NODE = 'FUNCTION_BODY_NODE'
		const CLASS_NODE = 'CLASS_NODE', HEAP_NODE = 'HEAP_NODE', PARAMETER_NODE = 'PARAMETER_NODE'
		const FUNCTION_HEADER_NODE = 'FUNCTION_HEADER_NODE', LOOP_NODE = 'LOOP_NODE'
		const RETURN_NODE = 'RETURN_NODE'

		// Visibility types
		const INNER = 'INNER'

		// Tracks the current row number of the nodeJson - necessary as some rows are duplicate, so
		// using row_key to track will cause an error
		let nodeJsonRowNum = 0;  

		let language = ('globals_field' in stackTrace.trace[0]) ? 'python' : 'java';
		let fields = { java: 'static_field', python: 'globals_field' }
		let self = { java: 'this', python: 'self' }

		for (var row_key of Object.keys(stackTrace.trace)) {
		    var elements = {}, nodes = [], edges = [];
		    var row_value_stack = stackTrace.trace[row_key].value_stack;
		    var row_heap = stackTrace.trace[row_key].heap;
		    var function_stack = stackTrace.trace[row_key].func_stack;
			var loop_stack = stackTrace.trace[row_key].loops;
			let node_order = 0;

		    // Error Handling
			// if (stackTrace.hasOwnProperty('error')){
			// 	throw new Error('Node JSON generator received error in stack trace');
			// }

			if (stackTrace.trace[row_key].event == "exception") {
				var err = {};
				
				// line number for error is accurate i nthe stack trace
				err['line'] = stackTrace.trace[row_key].line_no;	
				err["exception_msg"] = stackTrace.trace[row_key].exception_msg;
				nodeJson["error"] = err;
				break;		// break so code underneath which would crash doesn't run
			}

			if (stackTrace.trace[row_key].event == "raw_input") {
				var err = {};
				err["exception_msg"] = "Error: number of input calls is not equal to number of inputs supplied"
				nodeJson["error"] = err;
				break;		// break so code underneath which would crash doesn't run
			}

		    // First push main node, function type nodes are the big box ones, the rest are 
		    // just variables			
		    nodes.push({
		        data: {
		            id: '$main',
		            group: FUNCTION_BODY_NODE,
		            label: 'Main',
					order: node_order
		        },
		    });
			node_order += 1;

		    // Class nodes - has to be done separate from the heap, since heap and var nodes
		    // must be last
		    for (var value_key of Object.keys(row_heap)) {
		        var node_label = '', node_parent = '', id_found_flag = 0;
		        var node_type = Object.values(row_heap[value_key])[0];
				let node_is_return = 0;

				/**
				 * This variable states how the current class node is being instantiated. This could 
				 * be through a method (e.g. the self parameter through the class init method, in 
				 * case this value would be true), or a variable (after the init method has finished 
				 * calling, and the class instance has been assigned to a variable, and in which case
				 * this value would be false). 
				 * 
				 * This is necessary information to draw the edges connecting the class node to its
				 * instantiator (either the self parameter or the variable node) accurately
				 */
				var self_param_created_instance = false; 

				// identify the variable name from the unique variable id
				// look in global scope then in function scope
				for (var globals_key of Object.keys(stackTrace.trace[row_key][fields[language]])){
					if (stackTrace.trace[row_key][fields[language]][globals_key].REF == value_key){
						node_label = globals_key;
						node_parent = '$main'
						id_found_flag = 1;
						break;
					}
				}
				for (var func of Object.keys(function_stack)){
					if (id_found_flag == 1) break;
					for (var locals_key of Object.keys(function_stack[func].encoded_locals)){
						if (function_stack[func].encoded_locals[locals_key].REF == value_key){
							node_label = locals_key;

							// Since Main is an actual function in Java, have to check if the function's
							// unique hash is the main function. If so, the parent is $main instead of 
							// the unique hash from the stack trace
							if (language == 'java' 
									&& function_stack[func].unique_hash.includes('.main(java.lang.String[])')){
								node_parent = '$main'
							}
							else {
								node_parent = function_stack[func].unique_hash;
							}
							id_found_flag = 1;

							// Check if current node is a return node
							if (locals_key == '__return__'){
								node_is_return = 1;
							}

							break;
						}
					}
				}

				var node_is_nested = 0;
				/**
				 * Check if the current class node is nested (as in being pointed to by another
				 * heap node). To do this, loop through the entire row heap to search for the 
				 * current node within the nests. If node is nested (no matter which node points
				 * to it or how many), its visibility needs to be set to inner
				 * Edge drawing between the nested nodes are handled by response crafter
				 * */ 
				for (var heap_key of Object.keys(row_heap)){
					// Nested nodes don't have ids that appear in other scopes, if id not found, 
					// then there's a chance the current node is nested
					if (node_is_nested) break;
					for (var heap_val of Object.keys(row_heap[heap_key])){
						if (Array.isArray(row_heap[heap_key][heap_val])){
							let curHeapVal = row_heap[heap_key][heap_val];
							if (Array.isArray(curHeapVal[1]) && curHeapVal[1].length > 1){
								// Max number of arrays within arrays in stack trace is this much
								// No need recursion (for now)
								if (typeof curHeapVal[1][1] == "number" 
										&& curHeapVal[1][1] == value_key){
									// current class node is being pointed to by another heap node
									node_is_nested = 1;
									break;
								}
							}
							else {
								if (typeof curHeapVal[1] == "number" 
										&& curHeapVal[1] == value_key){
									// Heap node that points to current node is handled on webpage builder
									// since a specific value within the heap node points to the current node
									node_is_nested = 1;
									break;
								}
							}
						}
					}
				}
		        
		        // Check if the node type is a class instance or just a regular heap object
		        // If class object, only print out one node with class node type, then its
		        // local variables. Else, no need to search for the node's label
		        if (node_type === 'INSTANCE') {

					for (var func of Object.keys(function_stack)){
						for (var locals_key of Object.keys(function_stack[func].encoded_locals)){
							if (function_stack[func].encoded_locals[locals_key].REF == value_key){
								if (locals_key == self[language]){
									node_label = self[language];
									self_param_created_instance = true;
								}
								break;
							}
						}
					}

					// Drawing the class node itself - class node exists outside of any 
					// scopes, and have something pointing to it (either a variable or
					// a method that is currently initializing the class instance)
		            let classNodeInfo = {
						data: {
							id: value_key + '_HEAP',
							group: CLASS_NODE,
							label: node_label,
							type: Object.values(row_heap[value_key])[1],
							order: node_order
						}
					}
					if (node_is_nested) classNodeInfo.data.visibility = INNER;
					nodes.push(classNodeInfo);
					node_order += 1;

					// Draw the edge connecting the class node to its instantiator
					if (self_param_created_instance){
						edges.push({
							data: {
								id: value_key + '_SELFPARAM' + '&' + value_key + '_HEAP',
								source: value_key + '_SELFPARAM',
								target: value_key + '_HEAP'
							}
						})
		
						// No need to create an extra variable node like in below, since the self
						// node is created as a parameter node when looping through the function stack
					}
					/**
					 * If the class has been fully initialized and assigned to a variable,
					 * the variable node that represents the class instance would need to 
					 * be created as well
					 */
					nodes.push({
						data: {
							id: node_label,
							group: VARIABLE_NODE,
							label: node_label,
							type: Object.values(row_heap[value_key])[1],
							order: node_order,
							parent: node_parent
						}, 
					});
					node_order += 1;
	
					// The source is node_label, as the class node's label actually also
					// refers to the instantiator of the class instance
					edges.push({
						data: {
							id: node_label + '&' + value_key + '_HEAP',
							source: node_label,
							target: value_key + '_HEAP'
						}
					})
		
					// Class member variable handling
		            var var_count = 0;
		            for (var idx of Object.keys(row_heap[value_key])){
		                if (Array.isArray(row_heap[value_key][idx])){
		                    if ((Array.isArray(row_heap[value_key][idx][1])) && 
		                            (row_heap[value_key][idx][1][0] === 'REF')){
		                        // In this case, the current node is a reference variable 
		                        // belonging to a class instance e.g. a static list variable
		                        var corresponding_heap_node = row_heap[value_key][idx][1][1];
		                        // The corresponding heap node will be created in the heap node section
		                        // below, so only create the variable node here and the edge
		                        // The heap node section below will delete the variable node for that 
		                        // heap node, since that variable node corresponds to the current node here
		                        var corresponding_heap_node_type;

		                        // Loop through row heap to try and find the corresponding key of the 
		                        // actual heap node
		                        for (var i of Object.keys(row_heap)){
		                            if (i == corresponding_heap_node){
		                                corresponding_heap_node_type = Object.values(row_heap[i])[0];
		                                break;
		                            }
		                        }
		                        nodes.push({
		                            data: {
		                                id: value_key + '_HEAP' + '_local_' + var_count,
		                                group: VARIABLE_NODE,
		                                label: Object.values(row_heap[value_key])[idx][0],
		                                type: corresponding_heap_node_type,
		                                parent: value_key + '_HEAP',
										order: node_order
		                            },
		                        });
								node_order += 1;

		                        edges.push({
		                            data: {
		                                id: value_key + '_HEAP' + '_local_' + var_count + '&' + 
		                                        corresponding_heap_node + '_HEAP',
		                                source: value_key + '_HEAP' + '_local_' + var_count,
		                                target: corresponding_heap_node + '_HEAP'
		                            }
		                        });
		                    } else {
		                        nodes.push({
		                            data: {
		                                id: value_key + '_HEAP' + '_local_' + var_count,
		                                group: VARIABLE_NODE,
		                                label: Object.values(row_heap[value_key])[idx][0],
		                                value: Object.values(row_heap[value_key])[idx][2],
		                                type: Object.values(row_heap[value_key])[idx][1],
		                                parent: value_key + '_HEAP',
										order: node_order
		                            },
		                        });
								node_order += 1;
		                    }
		                    var_count += 1;
		                }
		            }
		        }
				else {
					// Since node type is just a regular heap object
					// print out a variable node that goes under the function 
					// the reference variable belongs in, then print out a heap node that shows the 
					// object's values, and list the edge that connects the variable and heap node
					// If it is a class instance, then it has already been handled above, and no need
					// to search for its fields
					var node_is_parameter = 0;

		            // Check if the node is a parameter of a function or a local variable
		            if (node_parent != '$main'){
		                for (var func of Object.keys(function_stack)){
		                    if ((function_stack[func].unique_hash == node_parent) && 
		                            (function_stack[func].parameter !== undefined) && 
		                            (function_stack[func].parameter.length != 0)){
		                        for (var param of Object.keys(function_stack[func].parameter)){
		                            // Current node is a parameter
		                            if (node_label == function_stack[func].parameter[param]){
		                                node_is_parameter = 1;
		                                break;
		                            }
		                        }
		                        break;
		                    }
		                }
		            }
		            if (node_is_nested){
		                // Since the node is nested, it cannot be a parameter, and must belong to 
		                // another heap node (not variable node)
		                // Due to that, a variable node will not be made, but instead only another
		                // heap node (a child) is created, which the parent heap node points to
		                
						
						// If the nested node also belongs to a global variable, need to draw out
						// the variable node as well - e.g. if list a is used to construct a new 
						// nested list for list b, like b["a_list"] = a, where a is global
						
						if (node_parent == '$main') {
							nodes.push({
								data: {
									id: value_key,
									group: (node_is_return) ? RETURN_NODE : VARIABLE_NODE,
									label: node_label,
									type: node_type,
									parent: node_parent,
									order: node_order
								}, 
							})
							node_order += 1;
						}

		                // Child heap node
						let childHeapNodeInfo = {
							data: {
		                        // id here should include '_HEAP' for consistency, since this node
		                        // could have another nested child node
		                        id: value_key + '_HEAP',
		                        group: HEAP_NODE,
		                        value: row_heap[value_key].slice(1),
		                        type: node_type,
								visibility: INNER,
								order: node_order
		                    }, 
						}
						if (node_type == 'DICT') childHeapNodeInfo.data.key = [];
						node_order += 1;
						nodes.push(childHeapNodeInfo);
		    
		                // No need to push another edge connecting the nested heap node to its parent,
						// response crafter handles it
		            } else {
		                var node_is_class_static_var = 0;
		                // If node is a class' static reference variable, then its variable node 
		                // would have already been printed when classes were handled, so don't 
		                // print the var node here
		                for (var i of Object.keys(row_heap)){
		                    for (var j of Object.keys(row_heap[i])){
		                        if ((Array.isArray(row_heap[i][j])) 
		                                && (Array.isArray(row_heap[i][j][1])) 
		                                && (row_heap[i][j][1][0] === 'REF') 
		                                && (row_heap[i][j][1][1] == value_key)
										&& (node_parent != '$main')) {
		                            // The value of the reference variable is placed in row_heap[i][j][1]
		                            if (node_label === '') node_label = row_heap[i][j][0]
		                            node_is_class_static_var = 1;
		                        }
		                    }
		                }
		                if (!node_is_class_static_var){
		                    nodes.push({
		                        data: {
		                            id: value_key,
		                            group: (node_is_parameter) ? PARAMETER_NODE : 
                                    		((node_is_return) ? RETURN_NODE : VARIABLE_NODE),
		                            label: node_label,
		                            type: node_type,
		                            parent: node_parent,
									order: node_order
		                        }, 
		                    });
							node_order += 1;

		                    // Edge
		                    edges.push({
		                        data: {
		                            id: value_key + '&' + value_key + '_HEAP',
		                            source: value_key,
		                            target: value_key + '_HEAP'
		                        }
		                    })
		                }
		                
		                // Heap node
						let heapNodeInfo = {
							data: {
		                        id: value_key + '_HEAP',
		                        group: HEAP_NODE,
		                        label: node_label,
		                        value: row_heap[value_key].slice(1),
		                        type: node_type,
								order: node_order
		                    }, 
						}
						if (node_type == 'DICT') heapNodeInfo.data.key = [];
						node_order += 1;
		                nodes.push(heapNodeInfo)
		            }
				}
		    }

		    // Function nodes - includes both the function name in the main function and
		    // the additional function box with more details 
		    if ((function_stack !== undefined) && (function_stack.length != 0)){
		        for (var func of Object.keys(function_stack)){
					// If the current function in function_stack is main function, skip it
					// Since main can be overloaded, must identify the proper main function
					// Only applicable for Java
					if (language == 'java' && function_stack[func].func_name == "main" 
							&& function_stack[func].unique_hash.includes('.main(java.lang.String[])')){
						continue;
					}

		            // push the function node as well as the variable node in main that will 
		            // point to the function
					let func_head_info = {
						data: {
							id: function_stack[func].unique_hash + '_FUNC_HEAD',
							group: FUNCTION_HEADER_NODE,
							label: function_stack[func].func_name,
							order: node_order
						}
					}
					node_order += 1;
		
					let func_body_info = {
						data: {
							id: function_stack[func].unique_hash,
							group: FUNCTION_BODY_NODE,
							label: function_stack[func].func_name,
							order: node_order
						}
					}
					node_order += 1;

					if (function_stack[func].func_class !== undefined){
						func_head_info.data.type = function_stack[func].func_class;
						func_body_info.data.type = function_stack[func].func_class;
					}

					if (function_stack[func].call_parent !== undefined){
						if (function_stack[func].call_parent.includes('.main(java.lang.String[])')){
							func_head_info.data.parent = '$main';
						}
						else {
							func_head_info.data.parent = function_stack[func].call_parent;
						}
					}
		
					nodes.push(func_head_info);
					nodes.push(func_body_info);

		            // Edge connecting the function header and body nodes
		            edges.push({
		                data: {
		                    id: function_stack[func].unique_hash + '_FUNC_HEAD' + '&' + 
		                        function_stack[func].unique_hash,
		                    source: function_stack[func].unique_hash + '_FUNC_HEAD',
		                    target: function_stack[func].unique_hash
		                }
		            })

		            // Find 'self' ref variables, since there will be clashes between the
		            // class instance and the function parameter, as they both address the
		            // same object. However, a parameter node still has to be drawn, so the
		            // code below is used to do that.
		            for (var idx of Object.keys(function_stack[func].encoded_locals)){
		                if (idx == self[language]){
							let parent_class = '';
							let class_node_name = function_stack[func].encoded_locals[idx].REF;
							if (function_stack[func].hasOwnProperty('func_class')) {
								parent_class = function_stack[func].func_class
							}
		                    nodes.push({
		                        data: {
		                            id: class_node_name + '_SELFPARAM',
		                            group: PARAMETER_NODE,
		                            label: node_label,
		                            parent: function_stack[func].unique_hash,
									type: parent_class,
									order: node_order
		                        },
		                    })
							node_order += 1;

							/**
							 * Check if there is a variable node also named self that was created
							 * earlier by the node push under the self_param_created_instance if
							 * statement. If the below code is removed, there will be a duplicate
							 * 'self' node in the init function if the class calls its constructor
							 */
							let extra_self_node_index = nodes.findIndex(x => 
									x.data.id === self[language] 
									&& x.data.label === self[language] 
									&& x.data.group === "VARIABLE_NODE" 
									&& x.data.type === parent_class 
									&& (x.data.parent === function_stack[func].unique_hash
										|| x.data.parent === "$main"));
							
							if (extra_self_node_index != -1){
								nodes.splice(extra_self_node_index, 1);
							}
							
							// Also remove the corresponding edge if it exists
							let self_node_edge_index = edges.findIndex(x => 
									x.data.source == self[language]
									&& x.data.target == class_node_name + '_HEAP');
							
							if (self_node_edge_index != -1){
								edges.splice(self_node_edge_index, 1);
							}
		                }
		            }
		        }
		    }

		    // Variable nodes for each row from the value stack
		    for (var value_key of Object.keys(row_value_stack)) {
		        var node_label = '', node_parent = '', id_found_flag = 0;
		        var node_is_parameter = 0, node_is_return = 0;

				let node_value = Object.values(row_value_stack[value_key])[1];
		        // identify the variable name from the unique variable id
		        // look in global scope then in function scope
		        for (var globals_key of Object.keys(stackTrace.trace[row_key][fields[language]])){
		            if (stackTrace.trace[row_key][fields[language]][globals_key].VAL == value_key){
		                node_label = globals_key;
		                node_parent = '$main'
		                id_found_flag = 1;
		                break;
		            }
		        }
		        for (var func of Object.keys(function_stack)){
		            if (id_found_flag == 1) break;
		            for (var locals_key of Object.keys(function_stack[func].encoded_locals)){
		                if (function_stack[func].encoded_locals[locals_key].VAL == value_key){
		                    node_label = locals_key;

							// Check through the Main function for Java
							if (language == 'java' 
									&& function_stack[func].unique_hash.includes('.main(java.lang.String[])')){
								node_parent = '$main'
							}
							else {
								node_parent = function_stack[func].unique_hash;
							}
							
		                    id_found_flag = 1;

							// Check if current node is a return node
							if (locals_key == '__return__'){
								node_is_return = 1;
								// Set label of the return node to be its value;
								if (node_value !== null){
									node_label = node_value;
								}
								else {
									node_label = "None";
								}
							}

		                    break;
		                }
		            }
		        }

		        // If the variable node is global, simply construct a variable node
		        // If not, consider if the variable is a function's input parameter
		        // or its local variable. Node creation will vary in each case
		        if (node_parent != '$main'){
		            for (var func of Object.keys(function_stack)){
		                if ((function_stack[func].unique_hash == node_parent) && 
		                        (function_stack[func].parameter !== undefined) && 
		                        (function_stack[func].parameter.length != 0)){
		                    for (var param of Object.keys(function_stack[func].parameter)){
		                        // Current node is a parameter
		                        if (node_label == function_stack[func].parameter[param]){
		                            node_is_parameter = 1;
		                            break;
		                        }
		                    }
		                    break;
		                }
		            }
		        }

				let nodeInfo = {
					data: {
		                id: value_key,
		                group: (node_is_parameter) ? PARAMETER_NODE : 
                        			((node_is_return) ? RETURN_NODE : VARIABLE_NODE),
		                label: node_label,
		                type: Object.values(row_value_stack[value_key])[0],
		                parent: node_parent,
						order: node_order
		            },
				}

				// Return nodes do not have any value, but param and variable nodes do
				if (!node_is_return){
					nodeInfo.data.value = node_value;
				}
		        nodes.push(nodeInfo);
				node_order += 1;
		    }

			// Store the order of occurrence of loops
			var loop_order = [];
			for (var loop_key of Object.keys(loop_stack)){
				loop_order.push(Object.keys(loop_stack[loop_key])[0]);
			}
			loop_order.sort();      // sorts the array in ascending order, so outermost loops first
		
			var firstLoopKeyFlag = true;
			for (var loop_key of Object.keys(loop_stack)){
				/**
				 * Look through the current list of nodes, and look for variables
				 * in the list of variables within the loop stack.
				 * For each variable in the loop stack, change their nodes' parents
				 * to the current loop
				 * 
				 * Inner loops will have a larger loop id from the stack trace, and 
				 * their prefixes will represent the scope that they exist in. E.g., 
				 * if the loop stack contains global_loop_5 and addK_loop_8, then
				 * global_loop_5 is the outer loop for addK_loop_8. In this scenario,
				 * the most likely situation is that addK is called inside global_loop_5
				 * and addK also contains a loop
				 * 
				 * Functions that are called within a loop will also be in the loops field
				 * of the stack trace
				 * */ 
		
				var loop_id = Object.keys(loop_stack[loop_key])[0];
				var node_parent = ''
				var loop_obj = loop_stack[loop_key][loop_id];

				var loop_type = loop_obj.TYPE;
				var loop_iter = loop_obj.ITER;

				// First check if the loop is non empty. If so, continue. Otherwise, don't create
				// the loop node
				if (loop_obj['VAL'].length != 0 || loop_obj['REF'].length != 0 
						|| loop_obj['FUNC'].length != 0){
					
					/** 
					 * Identify the parent of the loop node - current loop node could be nested
					 * or it could be the result of a function call, in which case the parent 
					 * is the function.
					 * Also have to handle functions calling nested loops
					 */
					// + 4 + 1 since loop id ends in "_loopxxx"
					let currLoopNodeNum = parseInt(loop_id.substring(loop_id.lastIndexOf("_") + 4 + 1));
					node_parent = loop_obj.CALL_FUNC;
					
					for (var i = 0; i < loop_order.length; i++){
						if (!loop_order[i].includes(loop_obj.CALL_FUNC)) continue;
						let loopArrayNum = parseInt(loop_order[i].substring(loop_order[i].lastIndexOf("_") + 4 + 1));
						if (loopArrayNum == currLoopNodeNum){
							break;
						}
						if (loopArrayNum < currLoopNodeNum){
							node_parent = loop_obj.CALL_FUNC + "_loop" + loopArrayNum;
						}
					}

					var loopNodeInfo = {
						data: {
							id: loop_id,
							group: LOOP_NODE,
							type: loop_type,
							parent: node_parent,
							value: loop_iter,
							order: node_order
						}
					}
					node_order += 1;
			
					// If we're at the first loop in the loops field
					// Provide an event field to indicate the loop has started / ended
					var stackTraceEvent = stackTrace.trace[row_key].event;
					if (stackTraceEvent === "loop_back" && firstLoopKeyFlag){
						loopNodeInfo.data.event = stackTraceEvent;
						firstLoopKeyFlag = false;       
					}
					else {
						loopNodeInfo.data.event = "step";
					}

					nodes.push(loopNodeInfo);
			
					// Check if the loop contains the current value key as a local variable node
					// Order for checking is VAL -> REF -> FUNC
					if (loop_obj['VAL'].length != 0){
						loop_obj['VAL'].forEach((item) => {
							let resNode = nodes.find(x => 
								(x.data.id == item && x.data.group == VARIABLE_NODE))
							if (resNode !== undefined){
								resNode.data.parent = loop_id;
								resNode.data.order = node_order;
								node_order += 1;
							}
						});
					}

					// Check if the loop contains the current value key as a local ref variable
					if (loop_obj['REF'].length != 0){
						loop_obj['REF'].forEach((item) => {
							/**	
							 * A heap node has '_HEAP' as the suffix of its id	
							 * If the name of the ref variable has a match in the nodes list,	
							 * that means that the heap node we're trying to edit is actually	
							 * paired with a variable node. In this case, don't change the	
							 * parent of the heap node, but instead change the parent of the	
							 * variable node	
							 * e.g. node with id "1" is a variable node tied to node with id	
							 * "1_HEAP", where the latter is the heap node	
							 *	
							* So far, heap nodes that are produced are never part of a function	
							* body, and instead exist outside. Therefore, only change the variable	
							* nodes they are attached to, and not the heap nodes themselves	
							*/
							let resNode = nodes.find(x => 
								(x.data.id == item && x.data.group == VARIABLE_NODE))
							if (resNode !== undefined){
								resNode.data.parent = loop_id;
								resNode.data.order = node_order;
								node_order += 1;
							}
						});
					}
			
					// Do the same for local function calls within the loop - function header
					// nodes will have their parents changed to the loop id
					if (loop_obj['FUNC'].length != 0){
						loop_obj['FUNC'].forEach((item) => {
							var funcHeadNodeName = item + '_FUNC_HEAD'
							let resNode = nodes.find(x => 
									(x.data.id == funcHeadNodeName) 
									&& (x.data.group == FUNCTION_HEADER_NODE))
							if (resNode !== undefined){
								resNode.data.parent = loop_id;
								resNode.data.order = node_order;
								node_order += 1;
							}
						});
					}
				}
			}

			if (row_key > 0){
				elements['line'] = stackTrace.trace[row_key - 1].line_no;		// Adding line number to each row
			}
			else {
				elements['line'] = -1; // Set as negative for 0th step, ensures no line highlighting
			}
		    elements['nodes'] = nodes;
		    elements['edges'] = edges;
			elements['stdout'] = stackTrace.trace[row_key].stdout;

			// Check if the current nodeJSON row is identical to the previous line. If so, ignore it
			// and move to the next row without appending the nodes of the current line
			let identicalToPrevRow = 0;

			// if (nodeJsonRowNum > 0){
			// 	var prevRow = new NodeJSONRow(nodeJson[nodeJsonRowNum-1].nodes, 
			// 		nodeJson[nodeJsonRowNum-1].edges, nodeJson[nodeJsonRowNum-1].stdout)
			// 	var curRow = new NodeJSONRow(elements.nodes, elements.edges, elements.stdout)

			// 	identicalToPrevRow = (prevRow.equals(curRow)) ? 1 : 0 ;
			// }

			// Add  && !identicalToPrevRow here later to remove duplicated steps
		    if ((row_value_stack !== undefined) && (row_value_stack.length != 0)){
		        // nodeJson[nodeJsonRowNum] = elements;
				// nodeJsonRowNum += 1;

				// Reorganizing node json so that all return nodes have max node order
				// This positions all return nodes at the bottom of their respective scopes
				elements.nodes.filter(function(item) {
					if (item.data.hasOwnProperty('group')){
						return item.data.group == RETURN_NODE || item.data.group == FUNCTION_HEADER_NODE;
					}
					else {
						return false;
					}
				}).forEach(function (x) {
					x.data.order = node_order;
					node_order += 1;
				})
				nodeJson[row_key] = elements;
		    }
		}
		return nodeJson;
	}
}

function NodeJSONRow(nodes, edges, stdout){
    this.nodes = nodes;
    this.edges = edges;
    this.stdout = stdout;
    this.equals = function(other){
        return JSON.stringify(this.nodes) == JSON.stringify(other.nodes)
                && JSON.stringify(this.edges) == JSON.stringify(other.edges)
                && JSON.stringify(this.stdout) == JSON.stringify(other.stdout)
    }
}

module.exports = JSONParser;