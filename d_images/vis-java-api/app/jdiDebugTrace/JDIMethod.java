package jdiDebugTrace;
import java.lang.String;
import java.util.Map;
import java.util.Collections;
import java.util.List;
import java.util.ArrayList;
import org.json.JSONException;

import com.sun.jdi.Type;
import com.sun.jdi.Value;
import com.sun.jdi.ObjectReference;
import com.sun.jdi.LocalVariable;
import com.sun.jdi.ThreadReference;
import com.sun.jdi.ClassType;
import com.sun.jdi.Method;
import com.sun.jdi.ClassNotLoadedException;
import com.sun.jdi.AbsentInformationException;


public class JDIMethod {
	private Method method;
	public String methodName;
	private List<String> arguments;
	private boolean isAbstract;
	private boolean isConstructor;
	private boolean isStatic;
	private Type returnType;
	private String accessible = "";
	public JDIMethod(Method m) throws ClassNotLoadedException,AbsentInformationException
	{
		method = m;
		methodName = method.toString();
		isAbstract = method.isAbstract();
		isConstructor = method.isConstructor();
		isStatic = method.isStatic();
		returnType = method.returnType();
	}
	public void loadMethodInfo() throws AbsentInformationException
	{
		loadMethodArguments();
		loadAccessible();
	}
	private void loadAccessible()
	{
		if(method.isPrivate())
			accessible = accessible +"Private ";
		if(method.isPublic())
			accessible = accessible +"Public ";
		if(method.isProtected())
			accessible = accessible +"Protected ";
		return;
	}
	private void loadMethodArguments() 
	{
		arguments = new ArrayList<String>();
		List<LocalVariable> args = null;
		try{
			args = method.arguments();
		}
		catch(AbsentInformationException err)
		{
			//no Arguments In the method
			return;
		}		
		for(LocalVariable v :args)
			arguments.add(v.name()+":"+v.typeName());
	}
	public boolean isConstructor() {return isConstructor;}
	public void printInfo(JDIJsonWriter jsonWriter) throws JSONException
	{
		jsonWriter.addFunction(methodName,accessible,returnType);
	}
}