# Things That Need To Be Done

* ~~Debugging options~~
* N + 1 problem solved
* Full documentation
* Graphical tool
* GitHub CI testing
* Implement the create command
* Implement the update command
* Implement the delete command

# sineQL

sineQL is a web API query language that mimics graphQL, designed solely for fun.

sineQL consists of two languages - the schema language, and the query language.

You can try the API right now!

```js
//create the wave function, wrapping a fetch to a server
const wave = body => fetch('https://krgamestudios.com/pokemon', {
    method: 'POST',
    headers: {
       'Content-Type': 'text/plain'
    },
    body: body
});

//get a list of pokemon names
wave('Pokemon { name }')
    .then(blob => blob.text())
    .then(text => console.log(text))
    .catch(err => console.log(err))
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
	Author author
	Date published
}

type Author {
	String name
	Book books
}
```

## The Query Language

The query langauge can be used to request data from a server, either in whole or in part by listing it's type and it's fields, and subfields.

```
Book {
	title
	author {
		name
		books {
			title
		}
	}
}
```

The fields can be altered as well, using the query language's built-in keywords:

* create
* update
* delete
* match
* set

`create`, `update` and `delete` do as you would expect them to.

When using `create`, `match` will find an existing record for a compound type and use that as it's value (multiple matches is an error):

```
create Book {
    set title "The Wind in the Willows"
    match author {
        name "Kenneth Grahame"
    }
}
```

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

When using `delete`, only `match` is valid, and will delete all matching records:

```
delete Book {
    match title "The Fart in the Fronds"
}
```

You can use as many instances of `match` and `set` as you like, as long as the result is valid.

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