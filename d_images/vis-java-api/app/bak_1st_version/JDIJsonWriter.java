package jdiDebugTrace;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.LinkedList;
import java.util.Queue;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Modifier;

import com.sun.jdi.Type;
import java.lang.reflect.Method;

public class JDIJsonWriter {
	
	private JSONObject trace;
	private JSONArray frames;
	private JSONObject classes;
	private JSONObject currFrame = null;
	private JSONObject currFunc = null;
	private LinkedList<JSONObject> functionStack = null;
	private HashMap<String,Integer> methodsID;
	private boolean firstFunc = true;
	public JDIJsonWriter() throws JSONException
	{
		this.trace = new JSONObject();
		this.frames = new JSONArray();
		this.classes = new JSONObject();
		this.trace.put("trace",frames);
		this.trace.put("class",classes);
		this.methodsID = new HashMap<String,Integer>();
		this.functionStack = new LinkedList<JSONObject>();
	}
	public void setFrameEvent(String event,String curr_function) throws JSONException
	{
		currFrame.put("event",event);
		currFrame.put("curr_func",curr_function);
	}
	private void insertBack() throws JSONException
	{
	
		if(currFrame == null)
			return;
		if(currFunc != null)
		{
			JSONArray func_stack = (JSONArray) currFrame.get("func_stack");
			func_stack.put(currFunc);
		}
		this.frames.put(currFrame);
	}
	public void createClassInfo(Class c) throws JSONException,SecurityException
	{
		JSONObject classInfo = new JSONObject();
		classInfo.put("PARENT",new JSONArray());
		JSONArray classFunction = new JSONArray();
		Method[] classMehods = c.getDeclaredMethods();
		for( Method m : classMehods)
		{
			JSONObject funcInfo = new JSONObject();
			funcInfo.put("class",m.getDeclaringClass().getName());
			funcInfo.put("func_name",m.getName());
			funcInfo.put("access_right",getMethodModifier(m.getModifiers()));
			JSONArray params = new JSONArray();
			for (Class param : m.getParameterTypes())
				params.put(param.getName());
			funcInfo.put("parameter",params);
			classFunction.put(funcInfo);
		}
		classInfo.put("FUNCTION",classFunction);
		this.classes.put(c.getName(),classInfo);
	}
	private String getMethodModifier(int i)
	{
		String access = "";
		if (Modifier.isAbstract(i))
			access = access + "Abstract ";
		if (Modifier.isFinal(i))
			access = access + "Final ";
		if (Modifier.isInterface(i))
			access = access + "Interface ";
		if (Modifier.isNative(i))
			access = access + "Native ";
		if (Modifier.isPrivate(i))
			access = access + "Private ";
		if (Modifier.isProtected(i))
			access = access + "Protected ";
		if (Modifier.isPublic(i))
			access = access + "Public ";
		if (Modifier.isStatic(i))
			access = access + "Static ";
		if (Modifier.isStrict(i))
			access = access + "Strict ";
		if (Modifier.isSynchronized(i))
			access = access + "Synchronized ";
		if (Modifier.isTransient(i))
			access = access + "Transient ";
		if (Modifier.isVolatile(i))
			access = access + "Volatile ";
		if (access == "")
			access = "Public ";
		access = access.substring(0, access.length() - 1);
		return access;
	}
	public void createFrames() throws JSONException
	{
		if(currFrame != null)
			insertBack();

		firstFunc = true;
		methodsID.clear();
		currFunc = null;
		currFrame = new JSONObject();
		currFrame.put("hight_light",new JSONArray());
		currFrame.put("static_field",new JSONObject());
		currFrame.put("heap",new JSONObject());
		currFrame.put("value_stack",new JSONObject());
		currFrame.put("func_stack",new JSONArray());
		currFrame.put("loops",new JSONArray());
	}
	public void setStdout(String output) throws JSONException
	{
		currFrame.put("stdout",output);
	}
	public void setMethodsId(HashMap<String,Integer> prevMethodId)
	{
		methodsID = (HashMap<String,Integer>) prevMethodId.clone();
	}
	public void addLineno(int lineno,String line) throws JSONException
	{
		if(!firstFunc)
			return;
		currFrame.put("line",line);
		currFrame.put("line_no",lineno);
		firstFunc = false;
	}
	public void addFunction(String methodName,String accessible,Type returnType) throws JSONException
	{
		int id = getFunctionId(methodName);
		
		String call_parent = "";
		String funcName = methodName;
		
		if (currFunc != null)
		{
			call_parent = (String) currFunc.get("unique_hash");
			JSONArray func_stack = (JSONArray) currFrame.get("func_stack");
			func_stack.put(currFunc);
		}
		if (funcName.contains("("))
		{
			String[] names = funcName.split("\\(");
			names = names[0].split("\\.");
			funcName = names[names.length-1];
		}
			
		currFunc = new JSONObject();
		currFunc.put("func_name",funcName);
		currFunc.put("is_parent",false);
		currFunc.put("frame_id",1);
		currFunc.put("is_highlighted",true);
		currFunc.put("parent_frame_id_list",new JSONArray());
		currFunc.put("encoded_locals",new JSONObject());
		currFunc.put("parameter",new JSONArray());
		
		currFunc.put("unique_hash",methodName+"_f"+id);
		if (call_parent != "")
			currFunc.put("call_parent",call_parent);
		/*
		JSONArray func_stack = (JSONArray) currFrame.get("func_stack");
		func_stack.put(currFunc);
		*/
	}
	private int getFunctionId(String funcName)
	{
		int id;
		if(methodsID.containsKey(funcName))
			id = methodsID.get(funcName) + 1;
		else
			id = 1;
		methodsID.put(funcName,id);
		return id;
	}
	public void createHeapReference(HashMap<Long, Queue<Object>> extrefList) throws JSONException
	{
		for (Map.Entry<Long,  Queue<Object>> ref : extrefList.entrySet()) 
		{
			createHeapReference(ref.getKey(),ref.getValue());
		}
	}
	private void createHeapReference(Long refId, Queue<Object> valueList) throws JSONException
	{
		JSONArray varHeap = null;
		JSONObject stack = (JSONObject) currFrame.get("heap");
		Boolean isMap = (Boolean) valueList.poll();
		if(isMap)
		{
			String varType = (String) valueList.poll();
			String varString = (String) valueList.poll();
			varHeap = new JSONArray();
			varHeap.put(varType);
			try {
    	 		JSONObject jsonObject = new JSONObject(varString.replace("\"",""));
				varHeap.put(jsonObject);
				System.out.println(jsonObject.toString());
			}
			catch (JSONException err)
			{
				varHeap.put(varString.replace("\"",""));
				stack.put(Long.toString(refId),varHeap);	
				return;
			}
		}
		else
		{
			List<Object> values = (List<Object>) valueList.poll();
			varHeap = new JSONArray(values);
		}
		
		stack.put(Long.toString(refId),varHeap);
	}
	public void createClassInstance(String varName,String classType, Long refno) throws JSONException
	{
		JSONObject scope = (JSONObject) currFunc.get("encoded_locals");
		JSONObject classRef =  new JSONObject();
		classRef.put("REF",Long.toString(refno));
		scope.put(varName,classRef);
		JSONObject stack = (JSONObject) currFrame.get("heap");
		JSONArray classObject = new JSONArray();
		classObject.put("INSTANCE");
		classObject.put(classType);
		stack.put(Long.toString(refno),classObject);
	}
	public void createClassMember(Long classrefno,List<JDIObjectInstance> classMembers) throws JSONException
	{
		JSONObject stack = (JSONObject) currFrame.get("heap");
		JSONArray classObject = (JSONArray) stack.get(Long.toString(classrefno));
		for (JDIObjectInstance classVar:classMembers)
		{	
			JSONArray memberObject = new JSONArray();
			if (classVar.isReference == 0)
			{	
				memberObject.put(classVar.varName);
				memberObject.put(classVar.varType);
				memberObject.put(classVar.valueObject);
			}
			else
			{
				memberObject.put(classVar.varName);
				JSONArray refObject = new JSONArray();
				refObject.put("REF");
				refObject.put(classVar.uID);
				memberObject.put(refObject);
			}
			classObject.put(memberObject);
		}
	}
	public void createValues(String varName,Object value,boolean staticscope,Long refno) throws JSONException
	{
		JSONObject varRef = new JSONObject();
		JSONObject scope = null;
		varRef.put("REF",Long.toString(refno));
		if(staticscope)
			scope = (JSONObject) currFrame.get("static_field");
		else
			scope = (JSONObject) currFunc.get("encoded_locals");
		scope.put(varName,varRef);
	}
	public void createValues(String varName, String varType ,Object value, boolean staticscope) throws JSONException
	{
		JSONArray varArray = new JSONArray();
		JSONObject varValue = new JSONObject();
		JSONObject stack = (JSONObject) currFrame.get("value_stack");
		String scope = "";
		varArray.put(varType);
		varArray.put(value);
		if(staticscope)
		{
			scope = "static";
			varValue.put("VAL",scope+"_"+varName);
			JSONObject globals = (JSONObject) currFrame.get("static_field");
			globals.put(varName,varValue);
		}
		else
		{
			scope = (String) currFunc.get("unique_hash");
			varValue.put("VAL",scope+"_"+varName);
			JSONObject locals = (JSONObject) currFunc.get("encoded_locals");
			locals.put(varName,varValue);
		}
		stack.put(scope+"_"+varName,varArray);
    }
	public void setExceptionMessage(int lineno,String message) throws JSONException
	{
		if(currFrame != null)
		{	insertBack();
			currFrame = new JSONObject(currFrame.toString());
		}
		else
			currFrame = new JSONObject();
		currFrame.put("line_no",lineno);
		currFrame.put("exception",message);
		currFrame.put("event","exception");
	}
	public void setStdoutMessage(String message) throws JSONException
	{
		if(currFrame != null)
		{	
			currFrame.put("stdout",message);
		}
	}
	public void writeJsonFile() throws IOException,JSONException
	{
		if(currFrame != null)
			insertBack();
		System.out.print(trace.toString());
	}
	
	public static void main(String[] args) throws IOException,JSONException
	{
		JDIJsonWriter jsonWriter = new JDIJsonWriter();
		String[] linenoString = args[0].split(":");
		int errorLineNo = Integer.parseInt(linenoString[linenoString.length-1]);
		String message = "";
		for(int i=2; (i<args.length && args[i] != null) ;i++)
			message = message + args[i] +" ";
		jsonWriter.setExceptionMessage(errorLineNo,message);
		jsonWriter.writeJsonFile();
	}
}