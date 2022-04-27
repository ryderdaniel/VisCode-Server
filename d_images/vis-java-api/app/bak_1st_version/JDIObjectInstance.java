package jdiDebugTrace;
import java.lang.String;
import java.util.Objects;
import java.util.Set;
import java.util.Map;
import java.util.HashMap;
import java.util.Collections;
import java.util.List;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Queue;
import java.util.LinkedList;
import java.util.stream.Collectors;

import org.json.JSONException;

import com.sun.jdi.*;
import com.sun.jdi.Value;
import com.sun.jdi.ThreadReference;
import com.sun.jdi.StringReference;
import com.sun.jdi.ArrayReference;
import com.sun.jdi.ObjectReference;
import com.sun.jdi.ClassObjectReference;
import com.sun.jdi.ClassLoaderReference;
import com.sun.jdi.LocalVariable;
import com.sun.jdi.ReferenceType;
import com.sun.jdi.ClassType;
import com.sun.jdi.Field;
import com.sun.jdi.Method;
import com.sun.jdi.ClassNotLoadedException;
import com.sun.jdi.IncompatibleThreadStateException;


public class JDIObjectInstance {
	
	public String varName;
	public String varType;
	private String accessRight = "Local";
	private Value varValue;
	private ThreadReference thread;
	public int isReference = 0;  //0 = false , 1 = array , 2 = Collections/List/Map , 3= Class, 4= unknow)
	public long uID;
	public Object valueObject;
	private HashMap<Long,Queue<Object>> extrefList = new HashMap<Long,Queue<Object>>();
	private boolean isCustomClass = false;
	private List<JDIObjectInstance> classVariables = new ArrayList<JDIObjectInstance>();
	public JDIObjectInstance(LocalVariable localvar, Value value,ThreadReference thread)throws ClassNotLoadedException,IncompatibleThreadStateException
	{
		varName = localvar.name();
		varType = localvar.typeName();
		varValue = value;
		this.thread = thread;
		valueObject = getValue(value);
		
	}
	public JDIObjectInstance(Field f, ReferenceType ref,ThreadReference thread) throws ClassNotLoadedException,IncompatibleThreadStateException //For Static Field
	{
		this.thread = thread;
		accessRight = "Static";
		varName = f.name();
		varType = f.typeName();
		varValue = ref.getValue(f);
		valueObject = getValue(ref.getValue(f));
	}
	public JDIObjectInstance(Field f,Value value,ThreadReference thread) throws ClassNotLoadedException,IncompatibleThreadStateException
	{
		this.thread = thread;
		varName = f.name();
		varType =  f.type().name();
		valueObject = getValue(value);
		varValue = value;
	}
	public JDIObjectInstance(ObjectReference classRef,ThreadReference thread) throws ClassNotLoadedException,IncompatibleThreadStateException
	{
		this.thread = thread;
		varName = "self";
		varType = classRef.referenceType().name();
		varValue = classRef;
		valueObject = getValue(classRef);
	}
	private Long convertMap(ObjectReference ref,Value v)
	{
		List<Method> refmethod = ref.referenceType().methodsByName("entrySet");
		Long refuid = -1L;
		if (refmethod.size() == 0)
		{
			return refuid;
		}
		Method toEntrySet = refmethod.get(0);
		try{
			v = ref.invokeMethod(thread, toEntrySet, Collections.emptyList(), 0);
			refuid = ref.uniqueID();
			isReference = (isReference == 0 ? 2:isReference);
		}
		catch(Exception e)
		{
			return refuid;
		}

		return refuid;
	}
	private Value convertArray(ObjectReference ref,Value v)
	{
		List<Method> refmethod = ref.referenceType().methodsByName("toArray","()[Ljava/lang/Object;");
		if (refmethod.size() == 0)
		{
			return null;
		}
		Method toArray = refmethod.get(0);
		try{
			v = ref.invokeMethod(thread, toArray, Collections.emptyList(), 0);
			isReference = (isReference == 0 ? 2:isReference);
		}catch(Exception e)
		{
			return null;
		}
		return v;
	}
	public Object getValue(Value v)throws ClassNotLoadedException,IncompatibleThreadStateException
	{
		if (v instanceof ThreadReference || v instanceof ThreadGroupReference)
		{
			return null;
		}
		if(v instanceof ClassObjectReference)
		{
			return null;
		}	
		if(v instanceof ClassLoaderReference)
		{
			return null;
		}
		if(v instanceof StringReference)
		{
			StringReference ref = (StringReference) v;
			return ref.value();
		}
		else if(v instanceof ArrayReference)
		{
			isReference = (isReference == 0 ? 1:isReference);
			ArrayReference ref = (ArrayReference) v;
			List<Value> refList = ref.getValues();
			List<Object> vList = new ArrayList<>();
			for (Value obj:refList)
				vList.add(getValue(obj));			
			if(isReference != 1)
				return vList;

			uID = ref.uniqueID();
			List<String> arrRef = new ArrayList<String>();
			arrRef.add("REF");
			arrRef.add(Long.toString(uID));
			Queue<Object> values = new LinkedList<Object>();
			values.offer(false);
			vList.add(0,ref.type().name());
			values.offer(vList);
			extrefList.put(uID,values);
			
			return arrRef;
		}
		else if(v instanceof ObjectReference)
		{
			if(isCustomClassObject())
			{
				return null;
			}
			ObjectReference ref = (ObjectReference) v;
			
			Value isCollection = convertArray(ref,v);
			if(isCollection != null)
			{
				uID = ref.uniqueID();
				List<Object> arrayList = (List<Object>) getValue(isCollection);
				Queue<Object> values = new LinkedList<Object>();
				values.offer(false);
				arrayList.add(0,ref.type().name());
				values.offer(arrayList);
				extrefList.put(ref.uniqueID(),values);

				List<String> arrRef = new ArrayList<String>();
				arrRef.add("REF");
				arrRef.add(Long.toString(ref.uniqueID()));
				return arrRef;
			}
			Long isMap = convertMap(ref,v);
			isReference = (isReference == 0 ? 4:isReference);
			List<Method> refmethod = ref.referenceType().methodsByName("toString", "()Ljava/lang/String;");
			if (refmethod.size() == 0)
			{	
				return null;
			}
			Method toString = refmethod.get(0);
			try{
				Value value = ref.invokeMethod(thread, toString, Collections.emptyList(), 0);
				String valueString = value.toString();
				if(isMap > 0)
				{
					uID = ref.uniqueID();
					valueString = valueString.replace("=",":");
					Queue<Object> values = new LinkedList<Object>();
					values.offer(true);
					values.offer(ref.type().name());
					values.offer(valueString);
					extrefList.put(isMap,values);
					List<String> mapRef = new ArrayList<String>();
					mapRef.add("REF");
					mapRef.add(Long.toString(isMap));
					return mapRef;
				}
				return valueString;
			}catch(Exception e)
			{
				return null;
			}
			
		}
		return parseCommonValue(v);
	}
	private Object parseCommonValue(Value value) {
      	if(value instanceof IntegerValue) {
            return ((IntegerValue) value).value();
        } else if(value instanceof BooleanValue) {
            return ((BooleanValue) value).value();
        } else if(value instanceof ByteValue) {
            return ((ByteValue) value).value();
        } else if(value instanceof CharValue) {
            return ((CharValue) value).value();
        } else if(value instanceof ShortValue) {
            return ((ShortValue) value).value();
        } else if(value instanceof LongValue) {
            return ((LongValue) value).value();
        } else if(value instanceof FloatValue) {
            return ((FloatValue) value).value();
        } else if(value instanceof DoubleValue) {
            return ((DoubleValue) value).value();
        } else {
            return null;
        }
    }
	public boolean isCustomClassObject()throws ClassNotLoadedException,IncompatibleThreadStateException
	{
		ObjectReference ref = (ObjectReference) varValue;
		isReference = 3;
		uID = ref.uniqueID();
		ClassObjectReference classobj = ref.referenceType().classObject();
		String ClassName = classobj.reflectedType().name();
		Boolean flag = false;
		for(int i=0;i<JDIDebugger.debugClasses.length;i++)
		{
			if (ClassName.contains(JDIDebugger.debugClasses[i]))
			{	
				flag = true;
				break;
			}
		}
		isCustomClass = flag;
		if(!isCustomClass)
			return flag;
		getClassInfo(classobj.reflectedType(),ref);
		return true;
	}
	public void getClassInfo(ReferenceType classobj,ObjectReference ref) throws ClassNotLoadedException,IncompatibleThreadStateException
	{
		
		String className = classobj.name();
		List<Field> allfield = classobj.allFields();
		for (Field f: allfield)
		{	
			 getFieldInfo(f,ref);
		}
	}
	public void getFieldInfo(Field f,ObjectReference ref) throws ClassNotLoadedException,IncompatibleThreadStateException
	{
		
		if (f.isStatic()) //Reference to Static Field;
		{
			return;
		}
		if (ref == null)
			return;
		classVariables.add(new JDIObjectInstance(f,ref.getValue(f),ref.owningThread()));
	}
	public void printInfo(String tab,boolean Staticscope,JDIJsonWriter jsonWriter) throws JSONException
	{
		if (!isCustomClass)
		{	
			if(isReference == 0)
				jsonWriter.createValues(varName,varType,valueObject,Staticscope);
			else if (isReference == 1 || isReference == 2)
				jsonWriter.createValues(varName,valueObject,Staticscope,uID);
			else
				jsonWriter.createValues(varName,varType,valueObject,Staticscope);
		}
		else
		{
			jsonWriter.createClassInstance(varName,varType,uID);
			jsonWriter.createClassMember(uID,classVariables);
			for (JDIObjectInstance ins:classVariables)
				ins.printHeapReference(jsonWriter);
		}

		printHeapReference(jsonWriter);
	}
	public void printHeapReference(JDIJsonWriter jsonWriter) throws JSONException
	{
		if (extrefList.size() >0)
			jsonWriter.createHeapReference(extrefList);
	}
	public boolean compare(JDIObjectInstance obj)
	{
		return varName== obj.varName && varType == obj.varType && accessRight == obj.accessRight;
	}
}
