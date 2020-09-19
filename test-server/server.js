//express for testing
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.text());

//test the library
const schema = require('./schema.js');
const handler = require('./handler.js');
const sineQL = require('../index.js');

const sine = sineQL(schema, handler);

//open the end
app.post('/sineql', async (req, res) => {
	const [code, result] = await sine(req.body);
	res.status(code).send(result);
});

//startup
app.listen(process.env.WEB_PORT || 3100, err => {
	console.log(`listening to *:${process.env.WEB_PORT || 3100}`);
});
