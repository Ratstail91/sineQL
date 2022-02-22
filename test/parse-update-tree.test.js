const buildTypeGraph = require('../source/build-type-graph');
const parseInput = require('../source/parse-input');
const parseUpdateTree = require('../source/parse-update-tree');

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

update Book {
	match title "The Wind in the Willows"
	update rating 9.5
}

`;

const compoundBookQuery = `

update Book [
	{
		match title "The Philosopher's Kidney Stone"
		update published "1997-06-26"
	}
	{
		match title "The Chamber Pot of Secrets"
		update published "1998-07-02"
	}
	{
		match title "The Prisoner of Aunt Kazban"
		update published "1999-07-08"
	}
	{
		match title "The Goblet of the Fire Cocktail"
		update published "2000-07-08"
	}
	{
		match title "The Order for Kleenex"
		update published "2003-06-21"
	}
	{
		match title "The Half-Priced Pharmacy"
		update published "2005-07-16"
	}
	{
		match title "Yeah, I Got Nothing"
		update published "2007-07-21"
	}
]

`;

const simpleAuthorQuery = `

update Author {
	match name "Kenneth Grahame"
	update books {
		match title "The Wind in the Willows"
	}
}

`;

const compoundAuthorQuery = `

update Author {
	match name "J. K. Rolling"
	update books [
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

//do stuff
test('parseUpdateTree - update a single book', () => {
	//setup
	const tokens = parseInput(simpleBookQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const updateTree = parseUpdateTree(tokens, graph);

	//inspect
	expect(updateTree.length).toEqual(1);
	expect(updateTree[0].update).toEqual(true);
	expect(updateTree[0].title.match).toEqual('The Wind in the Willows');
	expect(updateTree[0].rating.update).toEqual(9.5);
});

test('parseUpdateTree - update multiple books', () => {
	//setup
	const tokens = parseInput(compoundBookQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const updateTree = parseUpdateTree(tokens, graph);

	//inspect
	expect(updateTree.length).toEqual(7);
	expect(updateTree[0].update).toEqual(true);
	expect(updateTree[0].title.match).toEqual('The Philosopher\'s Kidney Stone');
	expect(updateTree[0].published.update).toEqual('1997-06-26');
});

test('parseUpdateTree - single join', () => {
	//setup
	const tokens = parseInput(simpleAuthorQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const updateTree = parseUpdateTree(tokens, graph);

	//inspect
	expect(updateTree.length).toEqual(1);
	expect(updateTree[0].typeName).toEqual('Author');
	expect(updateTree[0].update).toEqual(true);
	expect(updateTree[0].name.match).toEqual('Kenneth Grahame');
	expect(updateTree[0].books.length).toEqual(1);
	expect(updateTree[0].books[0].title.match).toEqual('The Wind in the Willows');
});

test('parseUpdateTree - multiple join', () => {
	//setup
	const tokens = parseInput(compoundAuthorQuery, true);
	const graph = buildTypeGraph(simpleSchema);

	//process
	const updateTree = parseUpdateTree(tokens, graph);

	//inspect
	expect(updateTree.length).toEqual(1);
	expect(updateTree[0].typeName).toEqual('Author');
	expect(updateTree[0].update).toEqual(true);
	expect(updateTree[0].name.match).toEqual('J. K. Rolling');
	expect(updateTree[0].books.length).toEqual(7);
	expect(updateTree[0].books[0].title.match).toEqual('The Philosopher\'s Kidney Stone');
	expect(updateTree[0].books[6].title.match).toEqual('Yeah, I Got Nothing');
});

