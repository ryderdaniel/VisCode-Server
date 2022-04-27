package jdiDebugTrace;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Stack;
import java.lang.Character;
import java.lang.String;


public class JDIStacticDectect {
	
	private HashMap<String,String> loopLocals;
	private HashMap<String,ArrayList<int[]>> loopRangesDetected;
	//int [] loopRange  = {startlineno,0,-1}; //line no , group count , flag
	private Stack<String[]> loopIdList;
	private String currLoopScope;

	final static private String[] loopKeyWords = {"for","do","while"};
	
	public JDIStacticDectect()
	{
		loopLocals = new HashMap<>();
		loopRangesDetected = new HashMap<>();
		loopIdList = new Stack<>();
		currLoopScope = "";
	}
	
	private String addLoopStatus(String codeline,String loopScope)
	{
		String status = null;
		if (currLoopScope != loopScope)
			return status;
		char[] codeArray = codeline.toCharArray();
		
		int group = 0;
		for (char c : codeArray)
		{
				if( c == '{' )
					group --;
				else if (c == '}')
					group ++;
		}
		if (group == 0)
			return status;
		
		ArrayList<int[]> loopRanges = loopRangesDetected.get(currLoopScope);
		for( int i = 0; i< loopRanges.size();i++)
		{
			loopRanges.get(i)[1] =  loopRanges.get(i)[1] + group;
			loopRanges.get(i)[2] = 1;
			if (loopRanges.get(i)[1] == 0)
				status = "return";
		}
		return status;
	}
	
	private String checkLineLoop(String codeline)
	{
		
		for( String keyWord : loopKeyWords)
		{
			String line = codeline;
			while (line.contains(keyWord))
			{
				int sindex = line.indexOf(keyWord);
				int endIndex = sindex + keyWord.length();
				if(sindex == 0)
				{
					if( line.length() == endIndex || (line.length() > endIndex && !Character.isLetter(line.charAt(endIndex))))
						return keyWord;
					line = line.substring(endIndex+1);
				}
				else if(Character.isLetter(line.charAt(sindex-1)) || ( line.length() > endIndex && Character.isLetter(line.charAt(endIndex))))
					line = line.substring(endIndex+1);
				else
					return keyWord;
			}
		}
		return null;
	}
	private String checkCurrentLoop(int lineno, String loopScope)
	{
		if (!loopRangesDetected.containsKey(loopScope))
			return null;
		ArrayList<int[]> loopRanges = loopRangesDetected.get(loopScope);
		String[] currLoopId = loopIdList.peek();
		String myLoopId = loopScope+"_loop"+Integer.toString(lineno);
		for(int i=0;i<loopRanges.size();i++)
		{
			if (lineno == loopRanges.get(i)[1])
			{
				if ((currLoopScope == loopScope) && currLoopId[0] == myLoopId)
					return "loop_back";
				return "loop_start";
			}
		}
		return null;
	}
	public String getLoopEvent(String codeline, int lineno, String loopScope)
	{
		String status = checkCurrentLoop(lineno,loopScope);
		if (status == "loop_back")
			return status;
		
		String looptype = checkLineLoop(codeline);
		
		if (looptype != null)
			addLoopStart(lineno,loopScope);
		
		status = addLoopStatus(codeline,loopScope);
		if (status != null)
			looptype = status;
		
		return looptype;
	}
	
	public void addLoopStart(int startlineno, String loopScope)
	{
		String[] loopInfo = {loopScope+"_loop"+Integer.toString(startlineno),loopScope};
		loopIdList.add(loopInfo);
		currLoopScope = loopScope;
		int [] loopRange  = {0,startlineno,startlineno}; //flag , start line number, current line number 
		if (loopRangesDetected.containsKey(loopScope))
		{
			ArrayList<int[]> loops = loopRangesDetected.get(loopScope);
			loops.add(loopRange);
		}
		else
		{
			ArrayList<int[]> loops = new ArrayList<>();
			loops.add(loopRange);
			loopRangesDetected.put(loopScope,loops);
		}
	}
	
	public static void main(String[] args){
		
	}
}