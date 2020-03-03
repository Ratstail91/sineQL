simpleQL is a web API query language that mimics graphQL, designed solely for fun.

simpleQL consists of two languages - the schema language, and the query language. The schema language is a layout of how queries should be made, as well as what can be made with them.

There are two built-in keywords for the schema language:

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
	!String name
	!Book[] books
}
```

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

