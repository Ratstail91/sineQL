//express for testing
const express = require('express');
const path = require('path');
const app = express();

//test the library
const schema = require('./schema.js');
//const handler = requre('./handler.js');
const simpleQL = require('./simpleQL');

const simple = simpleQL(schema);

//open the end
app.post('simpleQL', (req, res) => {
	res.status(200).send(simple(req.body));
});

//startup
app.listen(process.env.WEB_PORT || 3100, (err) => {
	console.log(`listening to *:${process.env.WEB_PORT || 3100}`);
});
