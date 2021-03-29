//the library to test
const sineQL = require('../source/index.js');

//the dummy values
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

const handler = null;

//run the function in debug mode (builds type graph)
const sine = sineQL(schema, handler, { debug: true });

