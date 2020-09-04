module.exports = `
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
`;
