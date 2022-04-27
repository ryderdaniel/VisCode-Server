import json
import copy
from write_json import jsonStackTrace

currline = 0
prescope = '<module>'
curscope = '<module>'
allHeapInstance = [{},{}]
allObjInstance = {}
varheap = []
loopstack = {} #funcod:lineno
curevent = ''
allStackTrace = []

def get_heap(refno,f_scope,name="Temp"):
    return objInstance(name,varheap[refno],"Heap")
    
def check_loop(curlineno,funcScopeId):
    if funcScopeId in loopstack.keys():
        prelineno = loopstack[funcScopeId]
        if curlineno > prelineno:
            return False
        if 'for' in line or 'while' in line:
            if curlineno in loopstack:
                return 'True_'+'called'
        else:
            return False
    else:
        loopstack[funcScopeId] = curlineno
class objInstance:
    def __init__(self,key,values,f_scope):
        self.name = key
        self.value_no = 1
        #self.scope = f_scope
        self.instance = None
        if isinstance(values,list):
            self.values = []
            if values[0] == "REF":
                self.scope = "Heap"
                self.refno = str(values[1])
                self.type = str(varheap[self.refno][0])
                self.load_instance(self.type,varheap[self.refno],f_scope)
                '''
                if self.type == "CLASS":
                    self.instance = classInstance(varheap[self.refno])
                elif self.type == "FUNCTION":
                    self.instance  = funcInstance(varheap[self.refno])
                else:
                    self.instance = refInstance(varheap[self.refno])
                    #valueitems = varheap[self.refno][1:]
				'''
            else:
                self.type = values[0]
                self.load_instance(self.type,values,f_scope)
            '''
            valueitems = values[1:]
            self.value_no = len(valueitems)
            for v in valueitems:
                if isinstance(v,list):
                    self.values.append(get_heap(str(v[1]),self.scope))
                else:
                    self.values.append(v)
			'''
            
        else:
            self.type = type(values)
            self.instance = varInstance(key,self.type,values,f_scope)
            '''
            self.values = values
            '''
    def load_instance(self,type,list_items,f_scope):
        if type == "CLASS" or type =="INSTANCE":
            if list_items[1] not in allHeapInstance[0].keys():
                self.instance = classInstance(list_items,f_scope)
            else:
                self.instance = copy.deepcopy(allHeapInstance[0][list_items[1]].instance)
                if type == "INSTANCE":
                    self.instance.changeValue(["REF",self.refno])
                self.set_fscop(f_scope)
                self.instance.setWriteMode('VAR')
        elif type == "FUNCTION":
            self.instance = funcInstance(list_items,f_scope)
        else:
            self.instance = refInstance(list_items,f_scope)       
    def get_items(self,name,type,values,f_scope):
        self.name = name
        self.type = type
        #self.scope = f_scope
        self.value_no = 1
        if isinstance(values, list):
            self.values = []
            self.value_no = len(values)
            for item in values:
                self.values.append(item) #self.values.append(instance(self.values.append(objinstance(item))))
        else:
            self.values = values
        self.print_Info()       
    def printInfo(self,tab=''):
        print(tab+'Frame Scope = ',self.instance.scope)
        if (self.type != 'FUNCTION' or self.type != 'CLASS'):
            print(tab+'Obj name = ',self.name)
        self.instance.printInfo(tab)
        '''
        print(tab+'Type = ',self.type)
        if self.type!='FUNCTION':
            print(tab+'value = ',self.get_value(),'\n')
        elif curevent == 'call':
            print(tab+'Passing parameters =',self.get_value(),'\n')
        '''
    def set_fscop(self,fscope):
        self.instance.scope = fscope        
    def get_value(self):
        if self.value_no == 1:
            return self.values
        else:
            values = []
            for item in self.values:
                if isinstance(item,objInstance):
                    values.append(item.get_value())
                else:
                    values.append(item)
            if self.scope == "Heap":
                return ["REF "+self.name+" -> ",values]
            return values
    def getJsonObj(self):
        self.jsondict = {};
        self.jsondict["curr_func_name"] = self.instance.scope
        self.jsondict["type"] = self.type
        self.jsondict["name"] = self.instance.name
        self.jsondict["value"] = self.instance.getValue()
        self.jsondict["func"] = self.instance.getFunc()
	

class refInstance():
    def __init__(self,values,fscope):
        self.scope = fscope
        self.values = values
        return
    def getValue(self):
        return self.values
    def getFunc(self):
        return []
        
class funcInstance():
    def __init__(self,funcList,fscope):
        self.name = funcList[1].split('(')[0]
        self.scope = fscope
        funcparam = funcList[1].split('(')[1].split(')')[0].split(',')
        self.funcparamName = [x.strip() for x in funcparam]
        self.varList = []
        self.overRide = False
        self.overLoad = False
        self.write = False
    def printInfo(self,tab=''):
        print(tab+'Function Name =',self.name)
        print(tab+'Function Parameter =',self.funcparamName,'\n')        
        if (self.write):
            for var in self.varList:
                var.printInfo(tab+'\t')
        print("\n")
    def localVariable(self,varList):
        if not self.write:
            return
        
        for name,value in varList.items():
            self.varList.append(objInstance(name,value,self.scope+self.name))
    def setWrite(self):
        self.write = True
    def getVarNameList(self):
        return [var.name for var in self.varList]
    def setLocalVariableValues(self,items):
        varNameList = self.getVarNameList()
        for name, value in items.items():
            if name in varNameList:
                index = varNameList.index(name)
                self.varList[index].instance.changeValue(value)
            else:
                self.localVariable({name:value})
    def getValue(self):
        return []
    def getFunc(self):
        return {"class":self.scope,"func_name":self.name."parameter":self.funcparamName}
class classInstance():
    def __init__(self,classList,fscope):
        self.name = classList[1]
        self.scope = fscope
        self.function = []
        self.classvar = {}
        self.parentnames = classList[2]
        self.writeMode = 'ALL'
        for func in classList[3:]:
            if len(func) > 0:
                cfunc = get_heap(str(func[1][1]),self.name,func[0])
                cfunc.set_fscop(self.name)
                self.function.append(cfunc)
        self.function = self.get_ParentFrame() + self.function
    def printInfo(self,tab=''):
        print(tab+'Class Name = ',self.name)
        if self.writeMode == 'VAR' or 'ALL':
            print(tab+'Var = self','\n')
            for classvar in self.classvar.values():
                classvar.printInfo(tab+'\t')
            if self.writeMode == 'VAR':
                return;
        print(tab+'Class Functions :','\n')
        for func in self.function:
            func.printInfo(tab+'\t')
        print("\n")
    def get_ParentFrame(self):
        if len(self.parentnames) == 0:
            return []
        func = []
        for pname in self.parentnames:
            parent = allHeapInstance[0][pname]
			
            for pfuc in parent.instance.function:
                if pfuc.name not in self.get_ListFuncName():
                    func.append(pfuc)
                '''
				elif pfuc.name == '__init__':
					func.append(pfunc)
                elif pfuc.name in self.get_ListFuncName():
                '''
        return func
    def get_ListFuncName(self):
        return [func.name for func in self.function]
    def getClassFunc(self,fname):
        funcName = self.get_ListFuncName()
        return self.function[funcName.index(fname)]
    def setWriteMode(self,mode): #ALL ,FUC ,VAR
        self.writeMode = mode;
    def changeValue(self,value):
        refno = str(value[1])
        classvarList = varheap[refno]
        if(len(classvarList) == 2):
            return
        classvarList = classvarList[2:]
        for classvar in classvarList:
            if classvar[0] not in self.classvar.keys():
                self.classvar[classvar[0]] = objInstance(classvar[0],classvar[1],self.scope)
            else:
                self.classvar[classvar[0]].instance.changeValue(classvar[1])
    def getFunc(self):
        funcList = []
        for func in self.function:
            funcList.append(func.getFunc())
    def getValue(self):
        vaList = ["self"]
        for var in self.classvar:
            

class varInstance():
    def __init__(self,key,type,values,fscope):
        self.type = type
        self.name = key
        self.values = values
        self.scope = fscope
    def printInfo(self,tab): 
        print(tab+'Name = ',self.name)
        print(tab+'Type = ',self.type)
        print(tab+'Value = ',self.values)
        print('\n')
    def changeValue(self,value):
        self.values = value
        
def compare_value(values1,values2):
    if type(values1) != type(values2):
        return False
    if not isinstance(values1,list):
        return (values1 == values2)
    if len(values1) != len(values2):
        return False
    for i in range(0,len(values1)):
        if not compare_value(values1[i],values2[i]):
            return False
    return True
        
def check_status(obj):
    return True
    for item in allObjInstance:
        if obj.name == item.name and obj.type == item.type and obj.scope == item.scope:
            if obj.scope == 'Heap' and (obj.refno != item.refno):
                continue
            if compare_value(obj.get_value(),item.get_value()):
                return False
            else:
                allObjInstance.remove(item)
                return True
    return True
    
def delete_objInstance(varscope):
    print('varscope =',varscope)
    if varscope in allObjInstance.keys():
        del allObjInstance[varscope]
    '''
    delete_list = []
    for item in allObjInstance:
        if item.scope == varscope:
            print('Var '+item.name+' clear \n')
            delete_list.append(item)
    for d in delete_list:
        allObjInstance.remove(d)
    '''

def check_heap():
    return
    delete_list = []
    for item in allObjInstance:
        if item.scope == "Heap" and item.refno not in varheap.keys():
            print('REF '+item.name+' Id = '+item.refno+' clear \n')
            delete_list.append(item)
    for d in delete_list:
        allObjInstance.remove(d)
    
def getLocalFuncInstanceInfo(name,funcId,varList):
    if funcId not in allObjInstance.keys():
        if "self" in varList.keys(): ##Class function
            ##Find Class 
            refno = varList["self"][1]
            className = varheap[str(refno)][1]
            obj = copy.deepcopy(allHeapInstance[0][className].instance.getClassFunc(name))
            obj.instance.setWrite()
            obj.instance.localVariable(varList)
            allObjInstance[funcId] = obj
    else:
        obj = allObjInstance[funcId]
        obj.instance.setLocalVariableValues(varList)

    print('func Id =',funcId)
    allObjInstance[funcId].printInfo()
    return funcId
        
def getObjInstanceInfo(line):
    varchange = False
    global varheap
    varglobals = line["globals"]
    varscope = curscope
    varheap = line["heap"]
    if curscope != '<module>':
        for fuc in reversed(line["stack_to_render"]):
            if fuc["func_name"] == curscope:
                varglobals = fuc["encoded_locals"]
                varscope = fuc["unique_hash"]
                print("curscope",curscope)
                return getLocalFuncInstanceInfo(fuc["func_name"],varscope,varglobals)
    check_heap()
    for key , value in varglobals.items():
        obj = objInstance(key,value,varscope)
        print("\n")
        if (obj.type == 'FUNCTION' or obj.type == 'CLASS') and curevent == 'step_line' and curscope == '<module>':
            if obj.type == 'CLASS':
                allHeapInstance[0][obj.name] = obj
            else:
                allHeapInstance[1][obj.name] = obj
        elif check_status(obj) and key != '__return__':
            #print('obj = ',obj.name)
            allObjInstance[obj.name] = obj
            #if curevent == 'call':
            #    print('Passing parameter =')
            obj.instance.setWriteMode('ALL')
            obj.printInfo()
        elif curevent == 'call':
            print('Passing parameters = \n',obj.get_value())
        elif curevent == 'return' and key == '__return__':
            print('Return = ',obj.get_value(),'\n')
    return varscope
    '''
    for key , values in varglobals.items():
        if isinstance(values,list):
            if 'REF' in values:
                ref_no = str(values[1])
                objdata = line["heap"][ref_no]
                if check_status(key,objdata[0],None,curscope) and key !='__return__':
                    if objdata[0] == 'FUNCTION':
                        obj = objInstance(key,objdata[0],None,curscope)
                        allObjInstance.append(obj)
                        varchange = True
        else:
            objtype = type(values)
            if check_status(key,objtype,values,curscope) and key != '__return__':
                obj = objInstance(key,objtype,values,curscope)
                allObjInstance.append(obj)
                varchange = True
    '''

def get_objInfo(line):
    global curscope,prescope,curevent,prevline,currline
    currline = line["line"]
    print("\n\ncurrent Line no =",line["line"],'\n')
    curevent = str(line['event'])
    curscope = str(line['func_name'])
    curglobal = line['ordered_globals']
    if(curscope == '<module>') and curevent == 'return':
        print("Main End")
    elif curevent == 'call':
        print('Entering Function ',curscope)
    St = jsonStackTrace(currline,curevent,curscope)
    vscope = getObjInstanceInfo(line)
    if curevent == 'return':
        print('Exiting Function ',curscope,' FId = ',vscope)
        
    prescope = curscope
    if curevent == 'return':
        delete_objInstance(vscope)

def read_json(fname):
    file = open(fname)
    trace_data = json.load(file)
    for line in trace_data['trace']:
        get_objInfo(line)
    file.close()

read_json('res1.json')
