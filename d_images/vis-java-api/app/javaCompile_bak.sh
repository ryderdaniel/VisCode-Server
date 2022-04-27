#!/bin/bash
folderName=$1
className=$2".java"
inputString=$(echo $3 | base64 -d)
output=$(javac -g -cp "jdiDebugTrace/org.json.jar:." jdiDebugTrace/*.java code/$folderName/$className 2>&1 | grep " error" | head -1)
if [[ $output ]]; then
	java jdiDebugTrace.JDIJsonWriter $output
else
	mv code/$folderName/$2.class $2.class
	java jdiDebugTrace.JDIDebugger $inputString $folderName/$2
	rm $2.class
fi

