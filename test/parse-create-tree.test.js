const buildTypeGraph = require('../source/build-type-graph');
const parseInput = require('../source/parse-input');
const parseCreateTree = require('../source/parse-create-tree');

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

const simpleBookQuery = `

create Book {
	create title "The Wind in the Willows"
	create published "1908"
	create rating 9.5
}

`;

const compoundBookQuery = `

create Book [
	{
		create title "The Philosepher's Kidney Stone"
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

`;

const simpleAuthorQuery = `

create Author {
	create name "Kenneth Grahame"
}

`;

const compoundAuthorQuery = `

create Author {
	create name "J. K. Rolling"
	match books [
		{ match title "The Philosopher's Kidney Stone" }
		{ match title "The Chamber Pot of Secrets" }
		{ match title "The Prisoner of Aunt Kazban" }
		{ match title "The Goblet of the Fire Cocktail" }
		{ match title "The Order for Kleenex" }
		{ match title "The Half-Priced Pharmacy" }
		{ match title "Yeah, I Got Nothing" }
	]
}

`;

const joiningQuery = `

create Author {
	match name "Kenneth Grahame"
	match books {
		match title "The Wind in the Willows"
	}
}

`;

//do stuff
test('parseCreateTree - create an author', () => {
	//setup
	const tokens = parseInput(simpleBookQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const createTree = parseCreateTree(tokens, graph);

	//inspect
	expect(createTree.length).toEqual(1);
	expect(createTree[0].create).toEqual(true);
	expect(createTree[0].typeName).toEqual('Book');
	expect(createTree[0].title.create).toEqual('The Wind in the Willows'); //new data is stored in the "create" field
});

test('parseCreateTree - create an array of books', () => {
	//setup
	const tokens = parseInput(compoundBookQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const createTree = parseCreateTree(tokens, graph);

	//inspect
	expect(createTree.length).toEqual(7);
});

test('parseCreateTree - create a single author', () => {
	//setup
	const tokens = parseInput(simpleAuthorQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const createTree = parseCreateTree(tokens, graph);

	//inspect
	expect(createTree.length).toEqual(1);
	expect(createTree[0].name.create).toEqual('Kenneth Grahame');
});

test('parseCreateTree - create an author with pre-existing books', () => {
	//setup
	const tokens = parseInput(compoundAuthorQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const createTree = parseCreateTree(tokens, graph);

	//inspect
	expect(createTree.length).toEqual(1);
	expect(createTree[0].books.length).toEqual(7);
});

test('parseCreateTree - join an existing author to an existing book', () => {
	//setup
	const tokens = parseInput(joiningQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const createTree = parseCreateTree(tokens, graph);

	//inspect
	expect(createTree.length).toEqual(1);
	expect(createTree[0].books.length).toEqual(1);
});

test('parseCreateTree - check for unique field', () => {
	//setup
	const tokens = parseInput(simpleAuthorQuery, true);
	const graph = buildTypeGraph(simpleSchema);
		
	//process
	const createTree = parseCreateTree(tokens, graph);

	//inspect
	expect(createTree[0].name.unique).toEqual(true); //a bit useless here, but good none the less
});

