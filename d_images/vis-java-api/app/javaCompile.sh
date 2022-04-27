#!/bin/bash
folderName=$1
className=$2".java"
inputString=$(echo $3 | base64 -d)
output=$(javac -g code/$folderName/$className 2>&1 -d "." | grep " error" | head -1)
if [[ $output ]]; then
	java jdiDebugTrace.JDIJsonWriter $output
else
	java jdiDebugTrace.JDIDebugger $inputString $folderName/$2
	rm $2.class
fi
