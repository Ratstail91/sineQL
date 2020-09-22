//the authors
let authors = [
	{
		name: 'J.K. Roaring',
		books: [
			{ title: 'The Philosepher\'s Kidney Stone' },
			{ title: 'The Chamber Pot of Secrets' },
			{ title: 'The Prisoner of Aunt Kazban' },
			{ title: 'The Goblet of the Fire Cocktail' },
			{ title: 'The Order for Kleenex' },
			{ title: 'The Half-Priced Pharmacy' },
			{ title: 'Yeah, I Got Nothing' },
		]
	},

	{
		name: 'Kenneth Grahame',
		books: [
			{ title: 'The Wind in the Willows', published: '1 April 1908' }
		]
	},
	
	{
		name: 'Kayne Ruse',
		books: [
			{ title: 'alpha', published: "1" },
			{ title: 'beta', published: "2" },
			{ title: 'gamma', published: "3" },
			{ title: 'delta', published: "4" },
			{ title: 'epsilon', published: "5" },
		]
	},
];

//insert the authors into the books (relationship)
authors = authors.map(a => {
	a.books = a.books.map(b => {
		b.authors = [a];
		return b;
	});
	return a;
});

//get the books array
let books = [];

authors.forEach(a => books = books.concat(a.books));

//the fake database
module.exports = {
	authors,
	books,
};