const express    = require('express');
const cors       = require('cors');
const axios      = require('axios');
const JSONParser = require('./JSONParser');

const app = express();
app.use(cors());

var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

app.post('/nodeJSON/python',(request, response) => {
    if(!request.body.source) response.send('source parameter missing...');
    var sourceCode = request.body.source;
    var usr_stdin = '';
	if (request.body.stdin) usr_stdin = request.body.stdin;
    
    axios.post('http://vis-python-api:6386/py',{source:sourceCode, stdin:usr_stdin})
    .then(res=>{
        let nodeJSON = JSONParser.generateNodeJSON(res.data);
        response.send(nodeJSON);
    }).catch(error=>{
        console.error(error);
    });
});

app.post('/nodeclass/python',(request, response) => {
    if(!request.body.source) response.send('source parameter missing...');
    var sourceCode = request.body.source;
    var usr_stdin = '';
	if (request.body.stdin) usr_stdin = request.body.stdin;
    
    axios.post('http://vis-python-api:6386/py',{source:sourceCode, stdin:usr_stdin})
    .then(res=>{
        let nodeJSON = JSONParser.generateNodeJSON(res.data);
        response.send({'node': nodeJSON, 'st_class': res.data});
    }).catch(error=>{
        console.error(error);
    });
});

app.post('/nodeJSON/java',(request, response) => {
    if(!request.body.source) response.send('source parameter missing...');
    var sourceCode = request.body.source;
    var usr_filename = request.body.filename;
    var usr_stdin = '';
    if (request.body.stdin) usr_stdin = request.body.stdin;
    
    axios.post('http://vis-java-api:6386/java',{source:sourceCode, stdin:usr_stdin, filename:usr_filename})
    .then(res=>{
        let nodeJSON = JSONParser.generateNodeJSON(res.data);
        response.send(nodeJSON);
    }).catch(error=>{
        console.error(error);
    });
});

app.post('/nodeclass/java',(request, response) => {
    if(!request.body.source) response.send('source parameter missing...');
    var sourceCode = request.body.source;
    var usr_filename = request.body.filename;
    var usr_stdin = '';
    if (request.body.stdin) usr_stdin = request.body.stdin;
    
    axios.post('http://vis-java-api:6386/java',{source:sourceCode, stdin:usr_stdin, filename:usr_filename})
    .then(res=>{
        let nodeJSON = JSONParser.generateNodeJSON(res.data);
        response.send({'node': nodeJSON, 'st_class': res.data});
    }).catch(error=>{
        console.error(error);
    });
});

const port = process.env.PORT || 6386;
app.listen(port, ()=> console.log(`listening on port ${port}...`));
