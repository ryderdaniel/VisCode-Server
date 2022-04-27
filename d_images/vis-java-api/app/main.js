const express = require('express');
const fs = require('fs');

const app = express();

var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(bodyParser.urlencoded({ extended: true }));

const { spawn } = require('child_process');

app.get('/java', (request, response)=>{
	response.send('The java endpoint is up...');
});

app.post('/java',(request, response) => {
    if(!request.body.source) response.send('source and/or filename parameter missing...');
    var sourceCode = request.body.source;
    var filename = request.body.filename;
    var usr_stdin = '';
	if (request.body.stdin) usr_stdin = request.body.stdin;

	// First create the users folder
	var foldername = (Math.random() + 1).toString(36).substring(7);
	while (fs.existsSync('code/'+foldername)){
		foldername = (Math.random() + 1).toString(36).substring(7);
	}
	fs.mkdirSync('code/' + foldername);

	// Next add their file
	var sys_filename = 'code/' + foldername + '/' + filename;
    fs.appendFile(sys_filename, sourceCode, function (err){
    	if (err) return console.log(err);
    });

    // Debug their file
    const child = spawn('./javaCompile.sh', [foldername, filename.slice(0,-5), btoa(usr_stdin)]);
    child.stdin.setEncoding('utf-8');
    child.stdout.pipe(process.stdout);

    var stackTrace = '';
    child.stdout.on('data', (data)=>{
        stackTrace += data.toString();    
    });

    child.stderr.on('data', (data)=>{
        stackTrace += data.toString();
    });

    child.on('close', (close)=>{
        if (stackTrace[0] != '{') stackTrace = {"error":stackTrace};
        // before sending the data back, delete the users folder.
        fs.rmSync('code/' + foldername, { recursive: true, force: true });
        response.send(stackTrace);
    });
});


const port = process.env.PORT || 6386;
app.listen(port, ()=> console.log(`listening on port ${port}...`));
