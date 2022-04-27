import json
import copy
from objectInstance import objInstance
from objectInstance import classInstance
#import objectInstance as objI

loopKeyWords = ('while ','for ')
code_data = None
allHeapInstance = [{},{}]
functionCallScope = {}
currLoopScope = []
loopLineMonitor = {}
loopDetected = {}
loopVariableScope = {}
globalKeyWord = "$main"

WHITE_LIST_INSTANCE = {'range_iterator'}

def create_default_instance(ins):
    #for ins in WHITE_LIST_INSTANCE:
    allHeapInstance[1][ins] = objInstance(ins,'_','module','_',flag = True)
    allHeapInstance[1][ins].objtype = "CLASS"
    allHeapInstance[1][ins].instance = classInstance(['CLASS',ins,[],[]],'module')
    allHeapInstance[1][ins].instance.set_default(True)
        
class JsonTrace:
    def __init__(self,trace,previousTrace):
        self.input_exception = False
        self.uncaught_exception = False
        self.event = trace['event']
        
        if self.event == "raw_input":
            self.input_exception = True
            self.prompt = trace['prompt']
            return
            
        self.lineno = trace['line']
        self.line = code_data[self.lineno-1]
        
        if "exception" in self.event:
            self.exceptionmsg = trace['exception_msg']
            if self.event == "uncaught_exception":
                self.event = 'exception'
                self.uncaught_exception = True
                return
        
        self.curr_func_name = trace['func_name']
        if self.curr_func_name == '<module>':
            self.curr_func_name = globalKeyWord
        self.curr_func_id = globalKeyWord
        self.hight_light = {'REF':[],'VAL':[], 'FUNC':[]}
        self.value_changed = {'REF':[],'VAL':[], 'FUNC':[]}
        self.remove_diff ={'REF':[], 'VAR':[],'FUNC':[]}
        self.globals_var = trace['globals']
        self.func_stack = trace['stack_to_render']
        self.value_stack = {}
        self.heap = trace['heap']
        self.loops = []
        self.stdout = trace['stdout']
        self.objvars = {}
        self.read_funcStack()
        self.check_different(previousTrace)
        self.detectloop()
        self.add_loop_info(previousTrace)
    def read_funcStack(self):
        self.read_ObjectInstance(globalKeyWord,self.globals_var)
        self.add_value_stack(globalKeyWord,self.globals_var)
        if len(self.func_stack) > 0:
            self.curr_func_id = self.func_stack[-1]["unique_hash"]
            
        for funcstack in self.func_stack:
            scope = funcstack['func_name']
            varList = funcstack['encoded_locals']
            if funcstack["unique_hash"] in functionCallScope.keys():
                funcstack["call_parent"] = functionCallScope[funcstack["unique_hash"]]
            del funcstack['ordered_varnames']
            del funcstack['is_zombie']
            func_class_name = None
            
            if "self" in varList.keys():
                func_class_name = self.heap[str(varList["self"][1])][1]
                func_class = allHeapInstance[1][func_class_name]
                List_func = func_class.instance.get_ListFuncName()
                funcstack['parameter'] = func_class.instance.function[List_func.index(scope)].instance.funcparamName
            funcstack['func_class'] = func_class_name
            
            self.read_ObjectInstance(funcstack["unique_hash"],varList,func_class_name)
            self.add_value_stack(funcstack["unique_hash"],funcstack['encoded_locals'])
    def read_ObjectInstance(self,scope,varList,func_class_name = None):
        self.objvars[scope] = []
        removeList = []
        for name,values in varList.items():
            obj = objInstance(name,values,scope,self.heap)
            if obj.return_readType() == 1:
                classIn = None
                if obj.objtype == 'INSTANCE' and self.heap[obj.refno][1] != 'module':
                    if func_class_name == None:
                        func_class_name = self.heap[str(values[1])][1]
                    if func_class_name not in allHeapInstance[1].keys():
                        create_default_instance(func_class_name)
                    classIn = copy.deepcopy(allHeapInstance[1][func_class_name])
                    
                    obj.load_obj_instance(classIn,self.heap,allHeapInstance[1])
                    
                elif obj.fscope == 'Heap':
                    obj.load_obj_instance(self.heap[obj.refno])
                else:
                    obj.load_obj_instance()

                self.objvars[scope].append(obj)
            else:
                index = 0
                if obj.objtype == 'CLASS':
                    index = 1
                if obj.var_name not in allHeapInstance[index].keys():
                    obj.load_heap_instance(self.heap[obj.refno],self.heap)
                    allHeapInstance[index][obj.var_name] = obj
                    
                else:
                    obj.load_heap_instance(allHeapInstance[index][obj.var_name],None,False)
                if index == 1:
                    obj.instance.get_parentFrame(allHeapInstance[1])
                '''    
                elif index == 0:
                    #check overloading / overriding
                    continue
                '''
                removeList.append(obj)
        
        for reobj in removeList:    
            reobj.deleteHeap(self.heap)
            del self.globals_var[reobj.var_name]
    def add_value_stack(self,scope,localsVar):
        for name in localsVar.keys():
            if isinstance(localsVar[name] ,list):
                refList = localsVar[name]
                localsVar[name] = {refList[0]:refList[1]}
                
        for i in range(0,len(self.objvars[scope])):
            if self.objvars[scope][i].fscope != 'Heap':
                self.value_stack[scope+'_'+self.objvars[scope][i].var_name] = self.objvars[scope][i].print_info()
                localsVar[self.objvars[scope][i].var_name] = {"VAL":scope+'_'+self.objvars[scope][i].var_name}
            elif self.objvars[scope][i].objtype == 'INSTANCE':
                self.heap[self.objvars[scope][i].refno] = self.objvars[scope][i].print_info()
    def check_different(self,prevStack):
        if prevStack == None:
            return
        # Adding functionCallScope
        if self.event == "call":
            #prevScope = prevStack.curr_func_id
            if len(self.func_stack) < 2:
                prevScope = globalKeyWord
            else:
                prevScope = self.func_stack[-2]["unique_hash"]
            functionCallScope[self.curr_func_id] = prevScope
            self.func_stack[-1]["call_parent"] = prevScope
            self.hight_light["FUNC"] = self.curr_func_id
            
        elif self.event == "return" and len(functionCallScope)>0:
            del functionCallScope[self.func_stack[-1]["unique_hash"]]

        #Dealing with removal, if the previousStack enters a return state
        if (len(prevStack.objvars.keys()) > len(self.objvars.keys()) and len(prevStack.func_stack) > 0):
            if prevStack.curr_func_name != self.curr_func_name or prevStack.curr_func_id != self.curr_func_id:
                self.remove_diff["FUNC"] = self.curr_func_id
                
        def getObjectVarIndex(target_list,itemName):
            for i in range(0,len(target_list)):
                if target_list[i].var_name == itemName:
                    return i;
            return -1;
            
        for scope,localvars in self.objvars.items():
            if scope not in list(prevStack.objvars.keys()):
                #new function define, new variables
                for var in localvars:
                    self.add_difference(1,scope,var)
            else: 
                #check variables
                #Check Hight Light
                #error_check

                error_index = getObjectVarIndex(prevStack.objvars[scope],2)
                for var in localvars:
                    index = getObjectVarIndex(prevStack.objvars[scope],var.var_name)
                    if index != -1:
                        if not (var.compare_instance(prevStack.objvars[scope][index])): 
                           self.add_difference(3,scope,var)
                        del prevStack.objvars[scope][index]
                    else: #new value
                        self.add_difference(1,scope,var)
                #Check Remove    
                for var in prevStack.objvars[scope]:
                    self.add_difference(2,scope,var)
    def add_difference(self,action,scope,obj):
        if action == 1:
            if obj.fscope == 'Heap':
                self.hight_light['REF'].append(obj.refno)
            else:
                self.hight_light['VAL'].append(scope+'_'+obj.var_name)
        elif action == 2:
            if obj.fscope == 'Heap':
                self.remove_diff['REF'].append(obj.refno)
            else:
                self.remove_diff['VAL'].append(scope+'_'+obj.var_name)
        else:
            if obj.fscope == 'Heap':
                self.value_changed['REF'].append(obj.refno)
            else:
                self.value_changed['VAL'].append(scope+'_'+obj.var_name)
    def add_loop_info(self,previousTrace):
        if previousTrace != None:
            self.loops = copy.deepcopy(previousTrace.loops)
       
        #Check for exit Loop      
        if len(currLoopScope) != 0 and previousTrace != None and len(previousTrace.loops) != 0:
        
            # check if the current line number is inside the curr loop 
            # continue or exit loop
            
            loop_start = currLoopScope[-1][1]
            currLoop = currLoopScope[-1][0]+'_loop'+str(loop_start)
            if self.curr_func_id != currLoopScope[-1][0]:
                flag = False
                if self.event == "call":
                    if previousTrace.curr_func_name in loopDetected.keys():
                        for loopRange in loopDetected[previousTrace.curr_func_name]:
                            if previousTrace.lineno in range(loopRange[0],loopRange[1]):
                                flag = True
                                break
                    elif previousTrace.curr_func_name in loopLineMonitor.keys():
                        if loopLineMonitor[previousTrace.curr_func_name][1] == previousTrace.lineno:
                            flag = True
                    if flag:
                        self.loops[0][currLoop]["FUNC"].append(self.curr_func_id)
            
            
            #When the loop geting Info finish , Not searching stage
            if self.event != 'loop_start' and self.curr_func_name in loopDetected.keys():
                if self.event == 'loop_back':
                    self.loops[0][currLoop]['ITER'] = self.loops[0][currLoop]['ITER'] + 1
                for looprange in loopDetected[self.curr_func_name]:
                    if loop_start == looprange[0]:
                        if self.lineno not in range(looprange[0],looprange[1]):
                            self.loops.pop(0)
                            currLoopScope.pop()
                            if len(currLoopScope) == 0 or len(self.loops) == 0:
                                return
                        break
            
            if self.curr_func_id != currLoopScope[-1][0] and self.event != "loop_start":
                return
                
            #add New item declared in the loop scope
            for scope, values in self.hight_light.items():
                for v in values:
                    #if v not in previousTrace.loops[0][currLoop][scope]:
                    self.loops[0][currLoop][scope].append(v)
                    loopVariableScope[currLoop].append(v)
                    
            #add changed item declared in the loop scope
            for scope,values in self.value_changed.items():
                for v in values:
                    if v not in previousTrace.loops[0][currLoop][scope] and v in loopVariableScope[currLoop]:
                        self.loops[0][currLoop][scope].append(v)    
                        
            if previousTrace.event == "return" and previousTrace.curr_func_id in self.loops[0][currLoop]["FUNC"]:
                self.loops[0][currLoop]["FUNC"].remove(previousTrace.curr_func_id)                
            
        if self.event == 'loop_start':
            loptype = ''
            for key in loopKeyWords:
                if key in self.line:
                    looptype = key.strip()
            loop_field = {self.curr_func_id+'_loop'+str(self.lineno):{'TYPE':looptype,'ITER':0,'CALL_FUNC':self.curr_func_id,'REF':[],'VAL':[],'FUNC':[]}}
            if [self.curr_func_id,self.lineno] not in currLoopScope:
                self.loops.insert(0,loop_field)
                loopVariableScope[self.curr_func_id+'_loop'+str(self.lineno)] = []
                currLoopScope.append([self.curr_func_id,self.lineno])
            return
    def add_loop_identifier(self,evt):
        if evt == 0:
            self.event = 'loop_start'
        elif evt == 1:
            self.event = 'loop_back'
    def checkloop(self):
        if self.event != 'step_line' and 'loop' not in self.event: 
        ##filter call / return/ exception event
            return False
        if self.curr_func_name not in list(loopDetected.keys()):
            return False
        flag = False
        
        for looprange in loopDetected[self.curr_func_name]:
            if self.lineno in range(looprange[0],looprange[1]):
                if self.lineno == looprange[0]:
                    if len(currLoopScope)>0 and [self.curr_func_id,self.lineno] in currLoopScope:
                        self.add_loop_identifier(1)
                    else:
                        self.add_loop_identifier(0)
                    return True
                return True
        return flag
    def detectloop(self):
        #check if there is a loop start
        if self.event != 'step_line':
            return
        status = self.checkloop()
        if status:
            return
        for keyword in loopKeyWords:
            if keyword in self.line:
                self.add_loop_identifier(0)
                if self.curr_func_name in list(loopLineMonitor.keys()):
                    if self.lineno not in loopLineMonitor[self.curr_func_name][0]:
                        loopLineMonitor[self.curr_func_name][0].append(self.lineno)
                        loopLineMonitor[self.curr_func_name][1] = self.lineno
                        return
                else:
                    loopLineMonitor[self.curr_func_name] = [[self.lineno],self.lineno]
                    return
        if len(currLoopScope) == 0 or self.curr_func_id != currLoopScope[-1][0]: #Enter/return a new Function
            return
        #check if there is a loop ends with
        if self.curr_func_name in list(loopLineMonitor.keys()):
            prevLine = loopLineMonitor[self.curr_func_name][1]
        else:
            return
            
        if self.lineno <= prevLine:
            #loop ends
            if not status and loopLineMonitor[self.curr_func_name][0]:
                loopstart = loopLineMonitor[self.curr_func_name][0].pop()
                loopend = prevLine
                if self.curr_func_name not in list(loopDetected.keys()):
                    loopDetected[self.curr_func_name] = [[loopstart,loopend+1]]
                else:
                    prevLoop = loopDetected[self.curr_func_name][-1]
                    if loopend == prevLoop[0]:
                        loopend = prevLoop[1]-1
                    loopDetected[self.curr_func_name].append([loopstart,loopend+1])
                self.add_loop_identifier(1)
                
        loopLineMonitor[self.curr_func_name][1] = self.lineno
    def write_json(self):
        if self.input_exception:
            stack_trace = {
            "event":self.event,
            "prompt":self.prompt
            }
            return stack_trace
            
        if self.uncaught_exception:
            stack_trace = {
            "line":self.line,
            "line_no":self.lineno,
            "event":self.event,
            "exception_msg":self.exceptionmsg
            }
            return stack_trace
            
        stack_trace = {
            "line":self.line,
            "line_no":self.lineno,
            "event":self.event,
            "curr_func":self.curr_func_name,
            #"highlight":self.hight_light,
            #"remove":self.remove_diff,
            "globals_field":self.globals_var,
            "func_stack":self.func_stack,
            "heap":self.heap,
            "value_stack":self.value_stack,
            "loops":self.loops,
            "stdout":self.stdout
            }
        if self.event == 'exception':
            stack_trace['exception_msg'] = self.exceptionmsg
        return stack_trace
    
def create_class_json(whole_trace_data):
    for name,classins in allHeapInstance[1].items():
        if not classins.instance.default:
            whole_trace_data['class'][name] = classins.instance.print_class_info()
            
def read_json(stackTrace,fname):
    trace_file = json.loads(stackTrace)
    global code_data
    code_data = trace_file['code']    
    code_data = code_data.split('\n')
    trace_data = trace_file['trace']
    whole_trace_data = {'class':{},'trace':[]}
    prevStack = None
    
    for st in trace_data:
        jsonST = JsonTrace(st,prevStack)
        whole_trace_data['trace'].append(jsonST.write_json())
        prevStack = jsonST
        
    create_class_json(whole_trace_data)
    if fname:
        with open(fname, 'w') as outfile:
            json.dump(whole_trace_data,outfile,indent=4)
    else:
        import sys
        json.dump(whole_trace_data,sys.stdout,indent=4)