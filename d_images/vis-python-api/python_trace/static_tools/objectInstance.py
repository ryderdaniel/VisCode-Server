import copy
class objInstance:
    def __init__(self,name,values,fscope,varheap):
        self.var_name = name
        self.value = values
        self.fscope = fscope
        self.refno = False
        if isinstance(self.value,list):
             if values[0] == "REF":
                self.refno = str(values[1])
                self.objtype = str(varheap[self.refno][0])
                self.fscope = 'Heap'
            #self.load_instance(self.objtype,varheap[self.refno],self.f_scope)
        else:
            self.objtype = str(str(type(self.value)).split("'")[1])
            
    def deleteHeap(self,varheap):
        if (not self.refno):
            return
        del varheap[self.refno]
        if self.objtype == 'FUNCTION':
            return
            
        if self.objtype == 'CLASS':
            for func in self.instance.function:
                del varheap[func.refno]
        return
        
    def return_readType(self):
        if self.objtype == 'CLASS' or self.objtype == 'FUNCTION':
            return 0 # heap Type
        else:
            return 1 # object Type
            
    def load_obj_instance(self,list_items = None ,varheap = None,heapInstance = None):
        if self.objtype =="INSTANCE":
                self.instance = copy.deepcopy(list_items.instance)
                self.instance.changeValue(varheap[self.refno],varheap,heapInstance)
        elif self.fscope == 'Heap':
            self.instance = refInstance(list_items,varheap[self.refno])
        else:
            self.instance = varInstance(self.var_name,self.objtype,self.value)
            
    def load_heap_instance(self,list_items,varheap = None,flag = True,):
        if not flag:
            self.instance = copy.deepcopy(list_items.instance)
            return
        if self.objtype == "CLASS":
            self.instance = classInstance(list_items,self.fscope,varheap)
        elif self.objtype == "FUNCTION":
            self.instance = funcInstance(list_items,self.fscope)
            
    def compare_instance(self,obj):
        if self.fscope != obj.fscope or self.instance.instancetype != obj.instance.instancetype:
            return false
        if self.instance.type != obj.instance.type :
            return false
        return self.instance.compare_value(obj.instance)
    
    def print_info(self):
        return self.instance.print_info()

class varInstance:
    def __init__(self,name,var_type,value):
        self.instancetype = 'Var'
        self.objtype = var_type
        self.value = value
    def get_value(self):
        return self.value
    def compare_value(self,obj_instance):
        return self.value == obj_instance.value
    def changeValue(self,value,varheap=None):
        self.value = value
    def print_info(self):
        json_info = []
        json_info.append(self.objtype)
        json_info.append(self.value)
        return json_info
        

class refInstance:
    def __init__(self,name,var_type,value):
        self.instancetype = 'Ref'
        self.objtype = var_type
        self.value = value
        
    def get_value(self):
        return self.value

    def compare_value(self,obj_instance):
        if len(self.value) != len(obj_instance.value):
            return false
        for i in range(0,len(self.value)):
            if self.value[i] != obj_instance[i]:
                return False
        return True
        
    def changeValue(self,refnoList,varheap):
        self.value = varheap[refnoList[1]]
        
    def print_info(self):
        json_info = []
        json_info.append(self.objtype)
        json_info.append(self.value)
        return json_info
        
class classInstance:
    def __init__(self,class_items,fscope,varheap = None):
        self.instancetype = 'Class'
        self.objtype = class_items[1]
        self.function = []
        self.classvar = {}
        self.parentnames = class_items[2]
        self.writeMode = 'read'
        for func in class_items[3:]:
            if len(func) > 0:
                func = objInstance(func[0],func[1],self.objtype,varheap)
                func.load_heap_instance(varheap[func.refno],varheap)
                self.function.append(func)
    def get_parentFrame(self,allHeapInstance):
        if len(self.parentnames) == 0:
            return []
        func = []
        for pname in self.parentnames:
            parent = allHeapInstance[1][pname]
            for pfuc in parent.instance.function:
                if pfuc.name not in self.get_ListFuncName():
                    func.append(pfuc)
                    
    def get_ListFuncName(self):
        return [func.var_name for func in self.function]
        
    def get_value(self):
        return self.classvar
        
    def compare_value(self,obj_instance):
        if len(self.classvar) != len(obj_instance.classvar):
            return false
        for i in range(0,len(self.value)):
            if self.classvar[i] != obj_instance.classvar[i]:
                return False
        return True
        
    def changeValue(self,class_Varlist,varheap = None,heapInstance= None):
        for class_var in class_Varlist[2:]:
            if class_var[0] not in self.classvar.keys() and class_var[0] != 'self':
                var = objInstance(class_var[0],class_var[1],class_Varlist[1],varheap)
                
                if var.fscope == 'HEAP':
                    var.load_obj_instance(varheap[var.refno])
                else:
                    var.load_obj_instance()
                    
                self.classvar[class_var[0]] = var
            else:
                self.classvar[class_var[0]].changeValue(class_var[1],varheap)
                
    def print_info(self):
        json_info = []
        json_info.append("INSTANCE")
        json_info.append(self.objtype)
        for class_name, var in self.classvar.items():
            json_info.append([class_name]+var.print_info())
        return json_info
        
class funcInstance:
    def __init__(self,funcList,fscope):
        self.instancetype = 'Func'
        self.name = funcList[1].split('(')[0]
        funcparam = funcList[1].split('(')[1].split(')')[0].split(',')
        self.scope = fscope
        self.funcparamName = [x.strip() for x in funcparam]
        self.overRide = False
        self.overLoad = False
    def get_value(self):
        return {"class":self.scope,"func_name":self.name,"parameter":self.funcparamName}
        
    def compare_value(self,func_Instance):
        func_dict = func_Instance.get_value()
        if (self.scope == func_dict["class"] and self.name == func_dict["func_name"]):
            if (len(self.funcparamName) != func_dict["parameter"]):
                return False
            for i in range(0,len(self.funcparamName)):
                if self.funcparamName[i] != func_dict["parameter"][i]:
                    return False
            return True
        return False
        