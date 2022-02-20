const buildTypeGraph = require('../source/build-type-graph');

const emptySchema = '';

const simpleSchema = `

scalar Date

type Book {
	unique String title
	Date published
	Float rating
}

type Author {
	unique String name
	Book books
}

`;

const missingDateSchema = `

type Book {
	unique String title
	Date published
	Float rating
}

type Author {
	unique String name
	Book books
}

`;

const outOfOrderSchema = `

type Book {
	unique String title
	Date published
	Float rating
}

type Author {
	unique String name
	Book books
}

scalar Date

`;

//parse the input, validating the structure as you go
test('buildTypeGraph - build an empty type graph', () => {
	const graph = buildTypeGraph(emptySchema, { debug: false });

	expect(Object.keys(graph).length).toEqual(4); //4 for the 4 base types
});

test('buildTypeGraph - build a simple type graph', () => {
	const graph = buildTypeGraph(simpleSchema, { debug: false });

	expect(Object.keys(graph).length).toEqual(7); //4 for the 4 base types + 3 for Date, Book, Author
});

test('buildTypeGraph - build an invalid type graph (missing Date)', () => {
	const f = () => buildTypeGraph(missingDateSchema, { debug: false });

	expect(f).toThrow("Unexpected value found as type field ('Date' is undefined)");
});

test('buildTypeGraph - build an invalid type graph (out of order Date)', () => {
	const f = () => buildTypeGraph(outOfOrderSchema, { debug: false });

	expect(f).toThrow("Unexpected value found as type field ('Date' is undefined)");
});

