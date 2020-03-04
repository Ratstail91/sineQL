//express for testing
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.text());

//test the library
const schema = require('./schema.js');
const handler = require('./handler.js');
const simpleQL = require('./simpleQL');

const simple = simpleQL(schema, handler);

//open the end
app.post('/simpleql', (req, res) => {
    const [code, result] = simple(req.body);
    res.status(code).send(result);
});

//startup
app.listen(process.env.WEB_PORT || 3100, err => {
    console.log(`listening to *:${process.env.WEB_PORT || 3100}`);
});