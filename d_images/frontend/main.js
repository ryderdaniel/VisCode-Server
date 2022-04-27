const express    = require('express');
const cors       = require('cors');
//const https      = require('https');
const fs         = require('fs');
const axios      = require('axios');
const resBuilder = require('./resBuilder');

const app = express();
app.use(cors());

var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

var responseCrafter = new resBuilder();

// Routes

// Python Routes
app.post('/python/extension', (request,response)=>{
    if(!request.body.source) response.send('source parameter missing...');
    var sourceCode = request.body.source;
    var usr_stdin = '';
	if (request.body.stdin) usr_stdin = request.body.stdin;
    
    axios.post('http://node-parser-api:6386/nodeclass/python',{source:sourceCode, stdin:usr_stdin})
    .then(res=>{
        //console.log(res.data);
        response.send(responseCrafter.craftHTMLDOC_vscode(res.data.node, res.data.st_class));
    }).catch(error=>{
        console.error(error);
    });
});

app.post('/python/browser', (request,response)=>{
    if(!request.body.source) response.send('source parameter missing...');
    var sourceCode = request.body.source;
    var usr_stdin = '';
	if (request.body.stdin) usr_stdin = request.body.stdin;
    
    axios.post('http://node-parser-api:6386/nodeclass/python',{source:sourceCode, stdin:usr_stdin})
    .then(res=>{
        response.send(responseCrafter.craftHTMLDOC(res.data.node, res.data.st_class));
    }).catch(error=>{
        console.error(error);
    });
});

// Debugging Enpoints
app.post('/python/nodejson', (request, response) => {
	if (!request.body.source) response.send('source parameter missing...');
	var sourceCode = request.body.source;
	var usr_stdin = '';
	if (request.body.stdin) usr_stdin = request.body.stdin;

	axios.post('http://node-parser-api:6386/nodeJSON/python', {source:sourceCode, stdin:usr_stdin})
	.then(res => {
		response.send(res.data)
	}).catch(error=>{
		console.error(error);
	});
});

app.post('/python/stacktrace', (request,response)=>{
    if(!request.body.source) response.send('source parameter missing...');
    var sourceCode = request.body.source;
    var usr_stdin = '';
	if (request.body.stdin) usr_stdin = request.body.stdin;
    
	axios.post('http://vis-python-api:6386/py',{source:sourceCode, stdin:usr_stdin})
    .then(res=>{
        response.send(res.data);
    }).catch(error=>{
        console.error(error);
    });
});

// Java Routes

app.post('/java/extension', (request,response)=>{
    if(!request.body.source) response.send('source parameter missing...');
    var sourceCode = request.body.source;
    var usr_filename = request.body.filename;
    var usr_stdin = '';
    if (request.body.stdin) usr_stdin = request.body.stdin;
    
    axios.post('http://node-parser-api:6386/nodeclass/java',{source:sourceCode, stdin:usr_stdin, filename:usr_filename})
    .then(res=>{
        //console.log(res.data);
        response.send(responseCrafter.craftHTMLDOC_vscode(res.data.node, res.data.st_class));
    }).catch(error=>{
        console.error(error);
    });
});

app.post('/java/browser', (request,response)=>{
    if(!request.body.source) response.send('source parameter missing...');
    var sourceCode = request.body.source;
    var usr_filename = request.body.filename;
    var usr_stdin = '';
    if (request.body.stdin) usr_stdin = request.body.stdin;
    
    axios.post('http://node-parser-api:6386/nodeclass/java',{source:sourceCode, stdin:usr_stdin, filename:usr_filename})
    .then(res=>{
        response.send(responseCrafter.craftHTMLDOC(res.data.node, res.data.st_class));
    }).catch(error=>{
        console.error(error);
    });
});

// Debugging Enpoints

app.post('/java/nodejson', (request, response) => {
    if (!request.body.source) response.send('source parameter missing...');
    var sourceCode = request.body.source;
    var usr_filename = request.body.filename;
    var usr_stdin = '';
    if (request.body.stdin) usr_stdin = request.body.stdin;

    axios.post('http://node-parser-api:6386/nodeJSON/java', {source:sourceCode, stdin:usr_stdin, filename:usr_filename})
    .then(res => {
        response.send(res.data)
    }).catch(error=>{
        console.error(error);
    });
});

app.post('/java/stacktrace', (request,response)=>{
    if(!request.body.source) response.send('source parameter missing...');
    var sourceCode = request.body.source;
    var usr_filename = request.body.filename;
    var usr_stdin = '';
    if (request.body.stdin) usr_stdin = request.body.stdin;
    
    axios.post('http://vis-java-api:6386/java',{source:sourceCode, stdin:usr_stdin, filename:usr_filename})
    .then(res=>{
        response.send(res.data);
    }).catch(error=>{
        console.error(error);
    });
});

// Testing Routes
app.get('/', (request,response)=>{
    response.send("This is the frontend");
});

// Begin Listening

app.listen(3000, ()=>{
    console.log('listening...')    
});

