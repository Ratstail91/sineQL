const buildTypeGraph = require('../source/build-type-graph');
const parseInput = require('../source/parse-input');
const parseQueryTree = require('../source/parse-query-tree');

//schemas
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

const simpleQuery = `

Author {
	name
	books {
		title
		published
	}
}

`;

const badTypeQuery = `

Company {
	author {
		name
	}
}

`;

const badFieldQuery = `

Author {
	name
	address
}

`;

//prepare for querying the database
test('parseQueryTree - simple query', () => {
	//setup
	const tokens = parseInput(simpleQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const queryTree = parseQueryTree(tokens, graph);

	//inspect
	expect(queryTree.typeName).toEqual('Author');
	expect(queryTree.name.typeName).toEqual('String');

	expect(queryTree.books.typeName).toEqual('Book');
	expect(queryTree.books.title.typeName).toEqual('String');
	expect(queryTree.books.published.typeName).toEqual('Date');
});

test('parseQueryTree - bad type query', () => {
	//setup
	const tokens = parseInput(badTypeQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const f = () => parseQueryTree(tokens, graph);

	//inspect
	expect(f).toThrow("Expected a type in the type graph (found Company)");
});

test('parseQueryTree - bad field query', () => {
	//setup
	const tokens = parseInput(badFieldQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const f = () => parseQueryTree(tokens, graph);

	//inspect
	expect(f).toThrow("Unexpected field name address in type Author");
});

test('parseQueryTree - check for unique field', () => {
	//setup
	const tokens = parseInput(simpleQuery, true);
	const graph = buildTypeGraph(simpleSchema);
		
	//process
	const queryTree = parseQueryTree(tokens, graph);

	//inspect
	expect(queryTree.name.unique).toEqual(true); //a bit useless here, but good none the less
});

