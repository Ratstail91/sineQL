const parseInput = require('../source/parse-input');

const schema = `

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

const query = `

Book {
	title "The wind in the willows"
}

`;

const mushedQuery = 'Book{title"published"}'; //this is strange lol

//parse the input with no concern for validity of the structure
test('parseInput - generate the lexemes', () => {
	const tokens = parseInput(schema, false, { debug: false });

	expect(tokens.length).toEqual(22); //each lexeme becomes a token
});

test('parseInput - generate the lexemes (with strings enabled)', () => {
	const tokens = parseInput(query, true, { debug: false });

	expect(tokens.length).toEqual(5); //each lexeme becomes a token
});

test('parseInput - generate the lexemes (with strings enabled)', () => {
	const tokens = parseInput(mushedQuery, true, { debug: false });

	expect(tokens.length).toEqual(5); //each lexeme becomes a token
});
