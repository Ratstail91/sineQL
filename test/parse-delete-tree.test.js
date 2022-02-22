const buildTypeGraph = require('../source/build-type-graph');
const parseInput = require('../source/parse-input');
const parseDeleteTree = require('../source/parse-delete-tree');

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

delete Book {
	match title "The Wind in the Willows"
}

`;

const compoundBookQuery = `

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

`;

const multipleFieldsQuery = `

delete Book {
	match title "The Wind in the Willows"
	match published "1908-04-01"
}

`;

//do stuff
test('parseDeleteTree - delete a single book', () => {
	//setup
	const tokens = parseInput(simpleBookQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const deleteTree = parseDeleteTree(tokens, graph);

	//inspect
	expect(deleteTree.length).toEqual(1);
	expect(deleteTree[0].delete).toEqual(true);
	expect(deleteTree[0].title.match).toEqual('The Wind in the Willows');
});

test('parseDeleteTree - delete multiple books', () => {
	//setup
	const tokens = parseInput(compoundBookQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const deleteTree = parseDeleteTree(tokens, graph);

	//inspect
	expect(deleteTree.length).toEqual(7);
	expect(deleteTree[0].delete).toEqual(true);
	expect(deleteTree[0].title.match).toEqual('The Philosopher\'s Kidney Stone');
});

test('parseDeleteTree - delete a book based on multiple match conditions', () => {
	//setup
	const tokens = parseInput(multipleFieldsQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const deleteTree = parseDeleteTree(tokens, graph);

	//inspect
	expect(deleteTree.length).toEqual(1);
	expect(deleteTree[0].delete).toEqual(true);
	expect(deleteTree[0].title.match).toEqual('The Wind in the Willows');
	expect(deleteTree[0].published.match).toEqual('1908-04-01');
});

