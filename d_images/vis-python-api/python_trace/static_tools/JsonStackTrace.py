import json
import copy
from objectInstance import objInstance
#import objectInstance as objI

code_data = None
allHeapInstance = [{},{}]
class JsonTrace:
    def __init__(self,trace):
        self.lineno = trace['line']
        self.line = code_data[self.lineno-1]
        self.event = trace['event']
        self.func_name = trace['func_name']
        self.hight_light = []
        self.globals_var = trace['globals']
        self.func_stack = trace['stack_to_render']
        self.value_stack = {}
        '''
          "func_name": "__init__",
          "is_parent": false,
          "frame_id": 1,
          "parent_frame_id_list": [],
          "parameters":{
            "self":["REF",11]
            "xCorrd":0,
            "yCorrd":0
            }
          "encoded_locals": {
            "self": [
              "REF",
              11
            ],
            "xCoord": 0,
            "yCoord": 0
          },
          
          "ordered_varnames": [  # dont need
            "self",
            "xCoord",
            "yCoord"
          ],
          
          "is_zombie": false,
          "is_highlighted": true,
          "unique_hash": "__init___f1"
        }
        '''
        self.heap = trace['heap']
        self.value_stack = {}
        self.loops = []
        self.stdout = trace['stdout']
        self.objvars = {}
        
        self.read_funcStack()
        
    def read_funcStack(self):
    
        self.read_ObjectInstance('global',self.globals_var)
        self.add_value_stack('global',self.globals_var)
    
        for funcstack in self.func_stack:
            scope = funcstack['func_name']
            varList = funcstack['encoded_locals']
            del funcstack['ordered_varnames']
            del funcstack['is_zombie']
            func_class_name = None
            
            if "self" in varList.keys():
                func_class_name = self.heap[str(varList["self"][1])][1]
                #print("func_stack['func_class']",func_class_name)
                func_class = allHeapInstance[1][func_class_name]
                List_func = func_class.instance.get_ListFuncName()
                #print('func List = ', List_func)
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
                if obj.objtype == 'INSTANCE':
                    #print('obj varname = ',obj.var_name,func_class_name)
                    if func_class_name == None:
                        func_class_name = self.heap[str(values[1])][1]
                    classIn = copy.deepcopy(allHeapInstance[1][func_class_name])
                    obj.load_obj_instance(classIn,self.heap,allHeapInstance[1])
                    
                elif obj.fscope == 'Heap':
                    obj.load_obj_instance(self.heap[obj.refno])
                else:
                    obj.load_obj_instance()
                # if  compare value changes , add hight_light
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
                self.value_stack[scope+'_'+str(i)] = self.objvars[scope][i].print_info()
                localsVar[self.objvars[scope][i].var_name] = {"VAL":scope+'_'+str(i)}
            elif self.objvars[scope][i].objtype == 'INSTANCE':
                #print('value stack In Heap',self.objvars[scope][i].var_name,self.objvars[scope][i].refno)
                #print(self.objvars[scope][i].print_info())
                self.heap[self.objvars[scope][i].refno] = self.objvars[scope][i].print_info()
    def write_json(self):
        
        stack_trace = {
            "line":self.line,
            "line_no":self.lineno,
            "event":self.event,
            "curr_func":self.func_name,
            "hight_light":self.hight_light,
            "globals_field":self.globals_var,
            "func_stack":self.func_stack,
            "heap":self.heap,
            "value_stack":self.value_stack,
            "loops":self.loops,
            "stdout":self.stdout
            }
        
        return stack_trace

def read_json(fname):
    file = open(fname)
    trace_file = json.load(file)
    global code_data
    code_data = trace_file['code']    
    code_data = code_data.split('\n')
    trace_data = trace_file['trace']
    whole_trace_data = {'trace':[]}
    for st in trace_data:
        jsonST = JsonTrace(st)
        whole_trace_data['trace'].append(jsonST.write_json())
        #a = input ('Next ?')
    with open('final_data.json', 'w') as outfile:
        json.dump(whole_trace_data,outfile,indent=4,)
