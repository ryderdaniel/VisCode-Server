package jdiDebugTrace;
import java.lang.String;

import java.util.Arrays;
import java.util.Map;
import java.util.Collections;
import java.util.List;
import java.util.ArrayList;
import org.json.JSONException;

import com.sun.jdi.ClassType;
import com.sun.jdi.LocalVariable;
import com.sun.jdi.Location;
import com.sun.jdi.StackFrame;
import com.sun.jdi.Value;
import com.sun.jdi.Method;
import com.sun.jdi.Field;
import com.sun.jdi.TypeComponent;
import com.sun.jdi.ObjectReference;
import com.sun.jdi.ThreadReference;
import com.sun.jdi.ReferenceType;
import com.sun.jdi.ClassNotLoadedException;
import com.sun.jdi.AbsentInformationException;
import com.sun.jdi.IncompatibleThreadStateException;

public class JDIStackFrame 
{
	private ReferenceType staticref;
	private ThreadReference thread;
	private StackFrame stackFrame;
	private Location currlocation;
	private JDIMethod currmethod;
	private int currlineno;
	private String[] debugClassNames;
	//private Map<LocalVariable, Value> visibleVariables ;
	private List<JDIObjectInstance> localVariables = new ArrayList<JDIObjectInstance>();
	private JDIObjectInstance classVariable = null;
	private List<JDIObjectInstance> staticVariables = new ArrayList<JDIObjectInstance>();
	
	public JDIStackFrame(ThreadReference threadref,StackFrame stFrame) throws ClassNotLoadedException,AbsentInformationException
	{
		thread = threadref;
		stackFrame = stFrame;
		currlocation = stackFrame.location();
		currmethod = new JDIMethod(currlocation.method());
		currlineno = currlocation.lineNumber();
		staticref = currlocation.declaringType();
	}
	public void loadMethodInfomation() throws AbsentInformationException
	{
		currmethod.loadMethodInfo();
	}
	public String getMethodName()
	{
		return currmethod.methodName;
	}
	public Location getLocation()
	{
		return currlocation;
	}
	public int getLineno()
	{
		return currlineno;
	}
	public boolean checkClasses()
	{
		boolean flag = false;
		if (getMethodName().contains(".lambda") || getMethodName().contains("$Lambda"))
			return false;
		for(int i=0;i<JDIDebugger.debugClasses.length;i++)
		{
			if (!flag  && currlocation.toString().contains(JDIDebugger.debugClasses[i]))
				flag = true;
		}
		
		return flag;
	}
	
	public void loadStaticInfo() throws ClassNotLoadedException,IncompatibleThreadStateException
	{
		if (staticref == null)
			return;
		List<Field> allfield = staticref.allFields();
		for (Field f: allfield)
		{
			if (f.isStatic() && Arrays.asList(JDIDebugger.debugClasses).contains(f.declaringType().name()))
				staticVariables.add(new JDIObjectInstance(f,staticref,thread));
		}
	}
	public void printMethod(JDIJsonWriter jsonWriter) throws JSONException
	{
		currmethod.printInfo(jsonWriter);
	}

	public void loadClassInstance() throws IncompatibleThreadStateException, ClassNotLoadedException
	{
		ObjectReference obj = stackFrame.thisObject();
		if(obj == null)
			return;
		classVariable = new JDIObjectInstance(obj,thread);
		localVariables.add(classVariable);
		return;
	}
	public void loadVariables() throws IncompatibleThreadStateException, ClassNotLoadedException
	{
		loadStaticInfo();
		loadClassInstance();
		List<LocalVariable> visVariables = null;
		try{
			visVariables = stackFrame.visibleVariables();
		}
		catch(AbsentInformationException err)
		{
			return;
		}
		Map<LocalVariable, Value> visibleVariables = stackFrame.getValues(visVariables);
		if(visibleVariables.size() == 0)
			return;
		
		for (Map.Entry<LocalVariable, Value> entry : visibleVariables.entrySet())
		{	
			localVariables.add(new JDIObjectInstance(entry.getKey(),entry.getValue(),	thread));
		}
	}
	
	public void printInfo(JDIJsonWriter jsonWriter) throws JSONException
	{
		
		for (JDIObjectInstance ins : staticVariables)
			ins.printInfo("",true,jsonWriter);
		for (JDIObjectInstance ins : localVariables)
			ins.printInfo("",false,jsonWriter);
	}
}