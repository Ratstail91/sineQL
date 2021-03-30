# sineQL

sineQL is a web API query language that mimics graphQL, designed solely for fun.

sineQL consists of two languages - the schema language, and the query language. sineQL assumes that the records are related in a non-looping tree-structure, defined by the schema language. Also, each non-scalar type queried is returned as an array.

The handler's definition is left up to the user.

## Example Server

A simple express server using sineQL.

```js
//express for testing
const express = require('express');
const app = express();

app.use(express.text());

//test the library
const sineQL = require('sineql');
const schema = require('./schema.js');
const queryHandler = require('./query-handler.js');

const sine = sineQL(schema, { queryHandler }, { debug: true });

//open the endpoint
app.post('/sineql', async (req, res) => {
	const [code, result] = await sine(req.body);
	res.status(code).send(result);
});

//startup
const port = process.env.WEB_PORT || 4000;
app.listen(port, err => {
	console.log(`listening to *:${port}`);
});
```

```js
const schema = `
scalar Date

type Book {
	String title
	Date published
}

type Author {
	String name
	Book books
}
`;

module.exports = schema;
```

```js
//there's a different handler object for query, create, update and delete
const queryHandler = {
	Author: (query, graph) => {
		//TODO: implement this
	},
	Book: (query, graph) => {
		//TODO: implement this
	},
};

module.exports = queryHandler;
```

Create a matching client-side function pointing to the server.

```js
//create the wave function, wrapping a fetch to the server
const wave = body => fetch('http://example.com/sineql', {
    method: 'POST',
    headers: {
       'Content-Type': 'text/plain'
    },
    body: body
});

//get a list of content
wave('Author { name books { title } }')
    .then(blob => blob.text())
    .then(text => console.log(text))
    .catch(e => console.error(e))
;
```

## The Schema Language

The schema language is a layout of how queries should be made, as well as what can be made with them. There are two built-in keywords for the schema language:

* type
* scalar

`type` is used for defining new compound types. `scalar` is for defining new scalar types, such as `Date`.

The built-in types for the schema language are:

* String
* Integer
* Float
* Boolean

These can be combined into compound types as so:

```
scalar Date

type Book {
	String title
	Date published
}

type Author {
	String name
	Book books
}
```

## The Query Language

The query langauge can be used to request data from a server, either in whole or in part by listing its type and its needed fields:

```
Author {
	name
	books {
		title
		published
	}
}
```

The fields can be altered as well, using the query language's built-in keywords:

* create
* update
* delete
* match
* set
* typeName

`create`, `update` and `delete` are still to be defined properly, but they'll probably work as follows.

### Create

When using `create`, `match` will find an existing record and associate that with the created values (multiple matches is an error):

```
Author {
	match name "Kenneth Grahame"
	create books {
		create title "The Wind in the Willows"
	}
}
```

You can create multiple records at once by surrounding them with `[]`:

```
create Book [
	{
		set title "The Philosepher's Kidney Stone"
	}
	{
		set title "The Chamber Pot of Secrets"
	}
	{
		set title "The Prisoner of Aunt Kazban"
	}
	{
		set title "The Goblet of the Fire Cocktail"
	}
	{
		set title "The Order for Kleenex"
	}
	{
		set title "The Half-Priced Pharmacy"
	}
	{
		set title "Yeah, I Got Nothing"
	}
]
```

### Update

When using `update`, `match` will find all existing records and update those using the `set` keyword:

```
update Book {
	match title "The Wind in the Willows"
	set published "15 June 1908"
}
```

```
update Book {
	match title "The Wind in the Willows"
	set title "The Fart in the Fronds"
}
```

### Delete

When using `delete`, only `match` is valid, and will delete all matching records:

```
delete Book {
	match title "The Fart in the Fronds"
}
```

You can use as many instances of `match` and `set` as you like, as long as the result is valid.

