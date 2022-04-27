import copy

class objInstance:
    def __init__(self,name,values,fscope,varheap,flag = False):
        
        self.var_name = name
        self.value = values
        self.fscope = fscope
        self.refno = False
        
        if flag:
            return
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
                if func.refno in varheap.keys():
                    del varheap[func.refno]
        return
        
    def return_readType(self):
        if self.objtype == 'CLASS' or self.objtype == 'FUNCTION':
            return 0 # heap Type
        else:
            return 1 # object Type
            
    def load_obj_instance(self,list_items = None ,varheap = None,heapInstance = None):
        if self.objtype =="INSTANCE" and heapInstance != None:
                self.instance = copy.deepcopy(list_items.instance)
                self.instance.changeValue(varheap[self.refno],varheap,heapInstance)
        elif self.fscope == 'Heap':
            self.instance = refInstance(list_items)
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
        else:
            self.instance = refInstance(varheap[self.refno])
            
    def compare_instance(self,obj):
        if self.fscope != obj.fscope or self.instance.instancetype != obj.instance.instancetype:
            return False
        if self.instance.objtype != obj.instance.objtype :
            return False
        if self.fscope == "Heap" and self.refno != obj.refno:
            return False
        return self.instance.compare_value(obj.instance)
    
    def print_info(self):
        return self.instance.print_info()
    def print_ref_info(self):
        json_info = []
        json_info.append("REF")
        json_info.append(self.refno)
        return json_info

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
    def __init__(self,list_items):
        self.instancetype = 'REF'
        self.objtype = list_items[0]
        if len(list_items)>1:
            self.value = list_items[1:]
        else:
            self.value = []
        
    def get_value(self):
        return self.value

    def compare_value(self,obj_instance):
        if len(self.value) != len(obj_instance.value):
            return False
        for i in range(0,len(self.value)):
            if self.value[i] != obj_instance.value[i]:
                return False
        return True
    def changeValue(self,refnoList,varheap):
        self.objtype =  varheap[refnoList[1]][0]
        self.value = varheap[refnoList[1]][1:]
        
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
        self.default = False
        self.readParent = False

        for func in class_items[3:]:
            
            if len(func) > 0:
                var = objInstance(func[0],func[1],self.objtype,varheap)
                if var.objtype == "FUNCTION":
                    var.fscope = self.objtype
                    self.function.append(var)
                else:
                    self.classvar[var.var_name] = var
                if var.refno:
                    var.load_heap_instance(varheap[var.refno],varheap)
                else:
                    var.load_obj_instance();
                
    def get_parentFrame(self,allHeapInstance):
        if len(self.parentnames) == 0 or self.readParent:
            return 
        func = []
        self.readParent = True
        for pname in self.parentnames:
            parent = allHeapInstance[pname]
            for pfuc in parent.instance.function:
                if pfuc.var_name not in self.get_ListFuncName():
                    func.append(pfuc)
        self.function = self.function + func
                    
    def get_ListFuncName(self):
        return [func.var_name for func in self.function]
        
    def get_value(self):
        return self.classvar
    def set_default(self,default_bool):
        self.default = default_bool
        
    def compare_value(self,obj_instance):
        if len(self.classvar) != len(obj_instance.classvar):
            return False
        for key in self.classvar.keys():
            if key not in obj_instance.classvar.keys():
                return False;
            if not self.classvar[key].compare_instance(obj_instance.classvar[key]):
                return False
        return True
        
    def changeValue(self,class_Varlist,varheap = None,heapInstance= None):
        if self.default:
            return
        for class_var in class_Varlist[2:]:
            if class_var[0] not in self.classvar.keys() and class_var[0] != 'self':
                var = objInstance(class_var[0],class_var[-1],self.objtype,varheap)
                if var.fscope == 'Heap':
                    var.load_obj_instance(varheap[var.refno])
                else:
                    var.load_obj_instance()
                    
                self.classvar[class_var[0]] = var
            else:
                self.classvar[class_var[0]].instance.changeValue(class_var[-1],varheap)
                
    def print_info(self):
        json_info = []
        json_info.append("INSTANCE")
        json_info.append(self.objtype)
        for class_name, var in self.classvar.items():
            if var.fscope == 'Heap':
                json_info.append([class_name,var.print_ref_info()])
            else:
                json_info.append([class_name]+var.print_info())
        return json_info
    def print_class_info(self):
        json_info = {}
        json_info["PARENT"] = self.parentnames
        json_info["FUNCTION"] = []
        for func in self.function:
            json_info["FUNCTION"].append(func.instance.get_value())
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
        self.accessRight = "Public"
        self.getAccessRight()
    def getAccessRight(self):
        if self.name[:2] == "__":
            self.accessRight = "Private"
        elif self.name[0] == "_":
            self.accessRight = "Protected"
    def get_value(self):
        return {"class":self.scope,"func_name":self.name,"access_right":self.accessRight,"parameter":self.funcparamName}
        
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
        
