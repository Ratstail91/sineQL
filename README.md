# sineQL

sineQL is a web API query language that mimics graphQL, designed solely for fun.

sineQL consists of two languages - the schema language, and the query language. sineQL assumes that the records are related in a non-looping tree-structure, defined by the schema language. Also, each non-scalar type queried is returned as an array.

The handler's definition is left up to the user.

## Feature List

* Easy to use schema language
* Easy to use query language
* Simple to set-up a server
* Each top-level keyword (and queries) is optional
* No package dependencies

## Example Server

A simple express server using sineQL.

```js
//express for testing
const express = require('express');
const app = express();

//uses text input
app.use(express.text());

//test the library
const sineQL = require('sineql');
const schema = require('./schema.js');
const queryHandler = require('./query-handler.js');

//omit 'createHandler', 'updateHandler' or 'deleteHandler' to disable those methods
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
	Float score
}

type Author {
	String name
	Boolean alive
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

The schema language is a layout of how queries should be made, as well as what can be made with them. There are several built-in keywords for the schema language:

* type
* scalar
* unique

`type` is used for defining new compound types. `scalar` is for defining new scalar types, such as `Date`. `unique` is a modifier on a field, indicating that it is unique in the database.

The built-in types for the schema language are:

* String
* Integer
* Float
* Boolean

These can be combined into compound types as so:

```
scalar Date

type Book {
	unique String title
	Date published
}

type Author {
	unique String name
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
* typeName (this is not used in either language, but rather is used internally)

`create`, `update` and `delete` are still to be defined properly, but they'll probably work as follows.

### Create

When using `create`, `match` will find an existing record and associate that with the created values:

```
create Author {
	create name "Kenneth Grahame"
	match books {
		match title "The Wind in the Willows"
	}
}
```

You can create multiple records at once by surrounding them with `[]`:

```
create Book [
	{
		create title "The Philosopher's Kidney Stone"
	}
	{
		create title "The Chamber Pot of Secrets"
	}
	{
		create title "The Prisoner of Aunt Kazban"
	}
	{
		create title "The Goblet of the Fire Cocktail"
	}
	{
		create title "The Order for Kleenex"
	}
	{
		create title "The Half-Priced Pharmacy"
	}
	{
		create title "Yeah, I Got Nothing"
	}
]
```

### Update

When using `update`, `match` will find all existing records and update those using the `set` keyword:

```
update Book {
	match title "The Wind in the Willows"
	set published "1908-4-1"
}
```

```
update Book {
	match title "The Wind in the Willows"
	set title "The Fart in the Fronds"
}
```

You can run multiple updates at once by surrounding them with `[]`:

```
update Book [
	{
		match title "The Philosopher's Kidney Stone"
		set published "1997-06-26"
	}
	{
		match title "The Chamber Pot of Secrets"
		set published "1998-07-02"
	}
	{
		match title "The Prisoner of Aunt Kazban"
		set published "1999-07-08"
	}
	{
		match title "The Goblet of the Fire Cocktail"
		set published "2000-07-08"
	}
	{
		match title "The Order for Kleenex"
		set published "2003-06-21"
	}
	{
		match title "The Half-Priced Pharmacy"
		set published "2005-07-16"
	}
	{
		match title "Yeah, I Got Nothing"
		set published "2007-07-21"
	}
]
```

### Delete

When using `delete`, only `match` is valid, and will delete all matching records:

```
delete Book {
	match title "The Fart in the Fronds"
}
```

You can run multiple deletes at once by surrounding them with `[]`:

```
delete Book [
	{
		match title "The Philosopher's Kidney Stone"
	}
	{
		match title "The Chamber Pot of Secrets"
	}
	{
		match title "The Prisoner of Aunt Kazban"
	}
	{
		match title "The Goblet of the Fire Cocktail"
	}
	{
		match title "The Order for Kleenex"
	}
	{
		match title "The Half-Priced Pharmacy"
	}
	{
		match title "Yeah, I Got Nothing"
	}
]
```

