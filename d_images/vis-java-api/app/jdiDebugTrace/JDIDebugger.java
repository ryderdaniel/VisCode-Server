//Compile 
//javac -g -cp "org.json.jar" *.java

//Zip to Jar
//jar cfm jdiDebugTrace.jar jdiDebugTrace/manifest.md jdiDebugTrace/*

//Compile
//javac -g -cp "jdiDebugTrace.jar;" test
//java -cp "org.json.jar;" jdiDebugTrace.JDIDebugger Main
//java -jar jdiDebugTrace.jar test

//Check Structure
//jar tf jdiDebugTrace.jar

//Check Manifest
//tar xfO jdiDebugTrace.jar META-INF/MANIFEST.MF
//java -classpath C:\java\MyClasses;C:\java\OtherClasse

package jdiDebugTrace;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.BufferedReader;

import java.util.Arrays;
import java.util.Map;
import java.util.Collections;
import java.util.List;
import java.util.Stack;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.regex.Pattern;  
import java.util.regex.Matcher;

import org.json.JSONException;

import java.lang.String;
import java.lang.ClassNotFoundException;
import java.lang.SecurityException;

import com.sun.jdi.AbsentInformationException;
import com.sun.jdi.ClassNotLoadedException;
import com.sun.jdi.IncompatibleThreadStateException;
import com.sun.jdi.VMDisconnectedException;
import com.sun.jdi.connect.IllegalConnectorArgumentsException;
import com.sun.jdi.Bootstrap;
import com.sun.jdi.ClassType;
import com.sun.jdi.Method;
import com.sun.jdi.Location;
import com.sun.jdi.StackFrame;
import com.sun.jdi.Value;
import com.sun.jdi.VirtualMachine;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.connect.VMStartException;
import com.sun.jdi.event.ExceptionEvent;
import com.sun.jdi.event.BreakpointEvent;
import com.sun.jdi.event.ClassPrepareEvent;

import com.sun.jdi.event.Event;
import com.sun.jdi.event.EventSet;
import com.sun.jdi.event.StepEvent;
import com.sun.jdi.event.LocatableEvent;
import com.sun.jdi.event.ThreadStartEvent;
import com.sun.jdi.event.MethodEntryEvent;
import com.sun.jdi.event.MethodExitEvent;
import com.sun.jdi.request.EventRequest;
import com.sun.jdi.request.ExceptionRequest;
import com.sun.jdi.request.BreakpointRequest;
import com.sun.jdi.request.MethodEntryRequest;
import com.sun.jdi.request.MethodExitRequest;
import com.sun.jdi.request.ThreadStartRequest;
import com.sun.jdi.request.ClassPrepareRequest;
import com.sun.jdi.request.StepRequest;

public class JDIDebugger {
	
	private ArrayList<String> codeLines;
    private int endLineNumber;
	private static JDIJsonWriter jsonWriter;
    private String event = "step_line";
    public int stackFrameLength = 0;
    private Stack<String> funcStack = null;
    private HashMap<String,Integer> methodsId = null;
    private Value returnValue;
    public static String[] debugClasses; 

	 public void setDebugClass(String[] classNames, int codeIndex) throws ClassNotFoundException, JSONException, SecurityException
	 {
         String[] className = new String[classNames.length - codeIndex];
         for (int i= codeIndex;i<classNames.length;i++)
		 {
			Class c = Class.forName(classNames[i].split("/")[1]);
			jsonWriter.createClassInfo(c);
			className[i - codeIndex] = c.getName();
		 }

         debugClasses = className;
         this.funcStack = new Stack<String>();
         this.methodsId = new HashMap<String,Integer>();
    }

    public void setCodeLine(String filename) throws IOException
	{
		this.codeLines = new ArrayList<>();
        Pattern pattern = Pattern.compile("class ");    

		try ( BufferedReader br = new BufferedReader(new FileReader("code/"+filename+".java"))) 
		{
			while (br.ready()) 
			{
				String line = br.readLine();
				codeLines.add(line);
				/*
				Matcher matcher = pattern.matcher(line);  
				if(matcher.find()){
					System.out.println(line);
					System.out.println(" starting at index "+matcher.start()+" and ending at index "+matcher.end());
				}
				*/
			}
		}
		
		this.endLineNumber = codeLines.size();
    }
    /**
     * Set return value event in the debugger Instance
     * @param event 
     */
    public void setReturnValue(Value v)
    {
        this.returnValue = v;
    }
    /**
     * Set local event in the debugger Instance
     * @param event 
     */
    public void setEvent(String event)
    {
       this.event = event;
    }
    public void setFuncStack(String funcName,boolean action)
    {
        if (action)
            this.funcStack.push(funcName);
        else
        {
            funcName = this.funcStack.pop();
            if (methodsId.containsKey(funcName))
                methodsId.put(funcName,methodsId.get(funcName)+1);
            else
                methodsId.put(funcName,1);
        }
    }
    /**
     * Sets the debug class as the main argument in the connector and launches the VM
     * @return VirtualMachine
     * @throws IOException
     * @throws IllegalConnectorArgumentsException
     * @throws VMStartException
     */
    public VirtualMachine connectAndLaunchVM() throws IOException, IllegalConnectorArgumentsException, VMStartException {
        LaunchingConnector launchingConnector = Bootstrap.virtualMachineManager().defaultConnector();
        Map<String, Connector.Argument> arguments = launchingConnector.defaultArguments();
        arguments.get("main").setValue(debugClasses[0]);
        VirtualMachine vm = launchingConnector.launch(arguments);
        return vm;
    }

    /**
     * Creates a request to prepare the debug class, add filter as the debug class and enables it
     * @param vm
     */
    public void enableClassPrepareRequest(VirtualMachine vm) {
        for (int i=0;i<debugClasses.length;i++)
        {
            ClassPrepareRequest classPrepareRequest = vm.eventRequestManager().createClassPrepareRequest();
            classPrepareRequest.addClassFilter(debugClasses[i]);
            classPrepareRequest.enable();
        }
    }
    /**
     * Creates a request to prepare the method entry and exit Event , add filter as the debug class and enables it
     * @param vm
     */
    public void enableMethodRequest(VirtualMachine vm)
    {
        /*
        MethodEntryRequest methodCall = vm.eventRequestManager().createMethodEntryRequest();
        methodCall.addClassFilter(debugClass.getName());
        methodCall.setSuspendPolicy(EventRequest.SUSPEND_EVENT_THREAD);
        methodCall.enable();
        */
        for(int i=0;i<debugClasses.length;i++)
        {
            MethodExitRequest methodExit = vm.eventRequestManager().createMethodExitRequest();
            methodExit.addClassFilter(debugClasses[i]);
            methodExit.enable();
        }
    }
    public void enableThreadStartRequest(VirtualMachine vm)
    {
        ThreadStartRequest threatst = vm.eventRequestManager().createThreadStartRequest();
        threatst.setSuspendPolicy(EventRequest.SUSPEND_ALL);
        threatst.enable();
    }
    /**
     * Creates a request to prepare the Exception event, add filter as the debug class and enables it
     * @param vm
     */
    public void enableExceptionRequest(VirtualMachine vm)
    {
        ExceptionRequest exception = vm.eventRequestManager().createExceptionRequest(null,true, true);
        exception.setSuspendPolicy(EventRequest.SUSPEND_ALL);
        exception.enable();
    }
    /**
     * Sets the break points at the line numbers mentioned in breakPointLines array
     * @param vm
     * @param event
     * @throws AbsentInformationException
     */
    public void setBreakPoints(VirtualMachine vm, ClassType classType,int startNumber, int endNumber) throws AbsentInformationException {       
        for(int lineNumber = startNumber ; lineNumber <= endNumber ; lineNumber ++)
        {
			//Check Empty Line !!
			if(classType.locationsOfLine(lineNumber).size() == 0)
				continue;
            Location location = classType.locationsOfLine(lineNumber).get(0);
            BreakpointRequest bpReq = vm.eventRequestManager().createBreakpointRequest(location);
            bpReq.enable();
        }
    }
    public void setExceptionEvent(int lineno,String exceptionMsg) throws JSONException
    {
        jsonWriter.setExceptionMessage(lineno,exceptionMsg);
        
    }
    /**
     * Displays the visible variables
     * @param event
     * @throws IncompatibleThreadStateException
     * @throws AbsentInformationException
     */
	 
    public boolean displayVariables(LocatableEvent event) throws ClassNotLoadedException, IncompatibleThreadStateException, AbsentInformationException, JSONException
    {
        boolean first = true;
        if (event.thread() == null)
            return true;
        
        if (!event.thread().isSuspended())
            return true;

        if (!event.thread().ownedMonitors().isEmpty() || event.thread().name().compareTo("main") != 0)
        {
            int lineno = event.thread().frame(0).location().lineNumber();
            this.setExceptionEvent(lineno,"Multi-Threading is not supported in this Application");
            return false;
        }
        
        int numFrames = event.thread().frameCount()-1;
        String curr_func = "";
        int currLineno = 0;
        int frameCount = 0;
        boolean skipflag = false;
        for(int i=numFrames;i>=0;i--)
		{
			JDIStackFrame currSTFrame = new JDIStackFrame(event.thread(),event.thread().frame(i));
			if (currSTFrame.checkClasses())
			{	
                if(first)
                {
                    jsonWriter.createFrames();
                    jsonWriter.setMethodsId(methodsId);
                    first = false;
                }
                currSTFrame.loadMethodInfomation();
                curr_func = currSTFrame.getMethodName();
                currLineno = currSTFrame.getLineno();
				currSTFrame.printMethod(jsonWriter);
				currSTFrame.loadVariables();
				currSTFrame.printInfo(jsonWriter);
                frameCount++;
			}
            else if (i ==0)
            {
                this.event = "step_line";
            }
		}
        String prev_func = "";
        jsonWriter.addLineno(currLineno,codeLines.get(currLineno-1));
        if (this.funcStack.size() > 0)
            prev_func = this.funcStack.peek();
        if (!this.event.equals("step_line") || (this.stackFrameLength >= frameCount && prev_func.equals(curr_func)))
        {
            if(this.event.equals("return"))
            {
                if (prev_func.equals(curr_func))
                    this.setFuncStack(curr_func,false);
                this.stackFrameLength = frameCount;
            }
            jsonWriter.setFrameEvent(this.event,curr_func);
        }
        else
        {
            jsonWriter.setFrameEvent("call",curr_func);
            this.setFuncStack(curr_func,true);
            this.stackFrameLength = frameCount;
        }
        
        return true;
        
    }
    public void displayThreadEvent(LocatableEvent event) throws IncompatibleThreadStateException
    {
        
        if (event.thread() == null)
        {    System.out.println("event Thread Null");
            return;
        }
        System.out.println("Display Thread Event");
        System.out.println(event.thread());
        System.out.println("Thread Location "+event.location().toString());
        System.out.println("frame Count = "+event.thread().frameCount());
        
        if (! event.thread().isSuspended())
        {
            System.out.println("Thread Suspend");
            event.thread().suspend();
            System.out.println(event.thread().status());
        }
        for(int i=0;i<event.thread().frameCount();i++)
		{
            Location currFrame = event.thread().frame(i).location();
            System.out.println("line number = "+String.valueOf(currFrame.lineNumber())+" "+currFrame.method().toString());
        }
        
    }

    /**
     * Enables step request for a break point
     * @param vm
     * @param event
     */
    public void enableStepRequest(VirtualMachine vm, BreakpointEvent event) {
        //enable step request for last break point
        if(event.location().toString().contains(debugClasses[0]+":"+this.endLineNumber)) {
            StepRequest stepRequest = vm.eventRequestManager().createStepRequest(event.thread(), StepRequest.STEP_LINE, StepRequest.STEP_OVER);
            stepRequest.addClassFilter(debugClasses[0]);
            stepRequest.enable();
        }
    }

	public static int[] setBreakPointsArray(int number)
	{
		int[] breakpts = new int[number];
		for(int i=0;i<number;i++)
			breakpts[i] = i;
		return breakpts;
	}
    public void setIOStream(VirtualMachine vm,InputStream vmStdout,OutputStream vmStdin,String inputString) throws IOException
    {
		String[] inputStrings = inputString.split("\n");
		OutputStreamWriter writer = new OutputStreamWriter(vmStdin);
		for(int i=0;i<inputStrings.length;i++)
			writer.write(inputStrings[i]+"\n");
		
		 writer.flush();
         writer.close();
		/*
        InputStream fileStream = new FileInputStream("in.txt");
        BufferedReader reader = new BufferedReader(new InputStreamReader(fileStream));
        OutputStreamWriter writer = new OutputStreamWriter(vmStdin);
        try{
            while(reader.ready()) {
                String line = reader.readLine();
                writer.write(line+"\n");
            }
            writer.flush();
            writer.close();
        }
        catch (IOException err)
        {
            return;
        }
		*/
    }
    public static void main(String[] args) throws Exception {
		jsonWriter = new JDIJsonWriter();
        JDIDebugger debuggerInstance = new JDIDebugger();
		String inputMessage = "";
		
		int codeIndex = 0;
		
		if (args.length > 1)
		{
			inputMessage = args[0].toString();
			codeIndex = 1;
		}
		
		debuggerInstance.setCodeLine(args[codeIndex]);
        debuggerInstance.setDebugClass(args,codeIndex);
		
        VirtualMachine vm = null;
		ClassType classType = null;
        Boolean readflag = true;

        try {
            vm = debuggerInstance.connectAndLaunchVM();
            debuggerInstance.enableClassPrepareRequest(vm);
            EventSet eventSet = null;
            debuggerInstance.setIOStream(vm,vm.process().getInputStream(),vm.process().getOutputStream(),inputMessage);

            InputStreamReader vmreader = new InputStreamReader(vm.process().getInputStream());
			String stdoutput = "";
			char[] buf = new char[512];

            while ((eventSet = vm.eventQueue().remove()) != null && readflag) 
			{
                for (Event event : eventSet) 
				{
                    /*
                    if (event instanceof MethodEntryEvent) {
                        MethodEntryEvent evt = (MethodEntryEvent) event;
                    }
                    */
                    if (event instanceof MethodExitEvent){
                        debuggerInstance.setEvent("return");
                        MethodExitEvent evt = (MethodExitEvent) event;
                        debuggerInstance.setReturnValue(evt.returnValue());
                        readflag = debuggerInstance.displayVariables(evt);
                    }
                    if (event instanceof ThreadStartEvent)
                    {
					   continue;
					   /*
                       debuggerInstance.setEvent("exception"); 
                       ThreadStartEvent evt = (ThreadStartEvent) event;
                       readflag = false;
                       int lineno = evt.thread().frame(0).location().lineNumber();
                       debuggerInstance.setExceptionEvent(lineno,"Multi-Threading is not supported in this Application");
					   */
                    }
					if (event instanceof ExceptionEvent) 
					{
                       debuggerInstance.setEvent("exception");
                       ExceptionEvent evt = (ExceptionEvent) event;
                       readflag = false;
                       int lineno = evt.thread().frame(0).location().lineNumber();
                       debuggerInstance.setExceptionEvent(lineno,evt.exception().toString());
                    } 
                    if (event instanceof ClassPrepareEvent) {
                        debuggerInstance.enableMethodRequest(vm);
                        debuggerInstance.enableExceptionRequest(vm);
                        //debuggerInstance.enableThreadStartRequest(vm);
                        ClassPrepareEvent evt = (ClassPrepareEvent) event;
                        classType = (ClassType) evt.referenceType();
                        debuggerInstance.setBreakPoints(vm, classType, 0 , debuggerInstance.endLineNumber);
                    }

                    if (event instanceof BreakpointEvent) {
                        debuggerInstance.setEvent("step_line");
                        //debuggerInstance.displayThreadEvent((BreakpointEvent) event);
                        readflag = debuggerInstance.displayVariables((BreakpointEvent) event);
                        debuggerInstance.enableStepRequest(vm, (BreakpointEvent)event);
                    }
					
                    if (event instanceof StepEvent) {
                        debuggerInstance.setEvent("step_line");
                        //debuggerInstance.displayThreadEvent((StepEvent) event);
                        readflag = debuggerInstance.displayVariables((StepEvent) event);
                    }

                    if(vmreader.ready())
                    {
                        String msg = "";
                        do{
                            vmreader.read(buf);
                            int coffset = 0;
                            for(;coffset<512;coffset++)
                            {
                                if(buf[coffset] == '\u0000') // remove null charactor
                                    break;
                            }
                            msg = msg+ new String(buf,0,coffset);
                        }while (vmreader.ready());
						stdoutput += msg;
                        
                    }
					jsonWriter.setStdoutMessage(stdoutput);
                    if (!readflag)
                    {
                        vm.dispose();
                        break;
                    }
                    else
                    {
                        vm.resume();
                    }
                }
                
            }
            
        } catch (VMDisconnectedException e) {
            jsonWriter.writeJsonFile();
            readflag = true;
        } 
        catch (Exception e) {
            e.printStackTrace();
        }
       
		if(!readflag)
        {
            jsonWriter.writeJsonFile();
        }
		
    }
    
}