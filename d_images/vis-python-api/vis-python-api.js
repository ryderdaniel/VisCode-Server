const express = require('express');

const app = express();

var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(bodyParser.urlencoded({ extended: true }));

const { spawn } = require('child_process');

app.post('/py',(request, response) => {
    if(!request.body.source) response.send('source parameter missing...');
    var sourceCode = request.body.source;
    var usr_stdin = '';
	if (request.body.stdin) usr_stdin = request.body.stdin;
    
    const child = spawn('python3', ['-u','/app/python_trace/generate_json_trace.py'], { detached: true });
    child.stdin.setEncoding('utf-8');
    child.stdout.pipe(process.stdout);
    child.stdin.write(JSON.stringify({code:sourceCode, stdin:usr_stdin}));
    child.stdin.end();

    var stackTrace = '';
    child.stdout.on('data', (data)=>{
        stackTrace += data.toString();    
    });

    child.stderr.on('data', (data)=>{
        stackTrace += data.toString();
    });

    child.on('close', (close)=>{
        if (stackTrace[0] != '{') stackTrace = {"error":stackTrace};
        response.send(stackTrace);
    });
});

app.get('/py', (request,response) => {
    response.sendFile('source_submitter.html', {root: __dirname });    
});

const port = process.env.PORT || 6386;
app.listen(port, ()=> console.log(`listening on port ${port}...`));
