//the matching schema
module.exports = `
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