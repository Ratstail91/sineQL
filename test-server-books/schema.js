module.exports = `
scalar Date

type Author {
	String name
	Book books
}

type Book {
	String title
	Date published
	Author authors
}
`;
