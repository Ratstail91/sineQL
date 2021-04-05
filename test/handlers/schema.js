//the matching schema
module.exports = `
scalar Date

type Book {
	String title
	Date published
	Float rating
}

type Author {
	String name
	Book books
}
`;