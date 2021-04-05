const booksData = [
	{ id: 1, title: 'Outlander', published: '1991', rating: 9.5 },
	{ id: 2, title: 'Dragonfly in Amber', published: '1992', rating: 9.5 },
	{ id: 3, title: 'Voyager', published: '1993', rating: 9.5 },
	{ id: 4, title: 'Drums of Autumn', published: '1996', rating: 9.5 },
	{ id: 5, title: 'The Fiery Cross', published: '2000', rating: 9.5 }, //Incorrect, the correct publish date is 2001
	{ id: 6, title: 'The Breath of Snow and Ashes', published: '2005', rating: 9.5 },
	{ id: 7, title: 'An Echo in the Bone', published: '2009', rating: 9.5 },
	{ id: 8, title: 'Written in my Own Heart\'s Blood', published: '2014', rating: 9.5 },
	{ id: 9, title: 'Go Tell the Bees That I Am Gone', published: null, rating: 9.5 },

	{ id: 10, title: 'The Forest of Silence', published: '2000', rating: 9.5 },
	{ id: 11, title: 'The Lake of Tears', published: '2000', rating: 9.5 },
	{ id: 12, title: 'The City of Rats', published: '2000', rating: 9.5 },
	{ id: 13, title: 'The Shifting Sands', published: '2000', rating: 9.5 },
	{ id: 14, title: 'Dread Mountain', published: '2000', rating: 9.5 },
	{ id: 15, title: 'The Maze of the Beast', published: '2000', rating: 9.5 },
	{ id: 16, title: 'The Valley of the Lost', published: '2000', rating: 9.5 },
	{ id: 17, title: 'Return to Del', published: '2000', rating: 9.5 },

	{ id: 18, title: 'The Wind in the Willows', published: '1908', rating: 9.5 },
];

const authorsData = [
	{ id: 1, name: 'Diana Gabaldon', books: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
	{ id: 2, name: 'Emily Rodda', books: [10, 11, 12, 13, 14, 15, 16, 17] },
	{ id: 3, name: 'Kenneth Grahame', books: [18] }
];

const books = {
	findAll: async args => {
		const { attributes, where } = args;

		//returning
		return booksData

			//filter out non-matching elements
			.filter(element => {
				//don't filter if no 'where' parameters
				if (Object.keys(where).length == 0) {
					return true;
				}

				//filter out by the 'where' values
				return Object.keys(where).reduce((result, key) => {
					return result && (element[key] || 'null').toString() == where[key].eq.toString();
				}, true);
			})

			//filter out non-used attributes
			.map(element => {
				//only they element keys that are in attributes
				const keys = Object.keys(element).filter(key => attributes.includes(key));

				//determine which fields to carry over
				const ret = {};
				keys.forEach(key => ret[key] = element[key]);

				return ret;
			})
		;
	}
};

const authors = {
	findAll: async args => {
		const { attributes, where } = args;

		//returning
		return authorsData

			//filter out non-matching elements
			.filter(element => {
				//don't filter if no 'where' parameters
				if (Object.keys(where).length == 0) {
					return true;
				}

				//filter out by the 'where' values
				return Object.keys(where).reduce((result, key) => {
					return result && (element[key] || 'null').toString() == where[key].eq.toString();
				}, true);
			})

			//filter out non-used attributes
			.map(element => {
				//only they element keys that are in attributes
				const keys = Object.keys(element).filter(key => attributes.includes(key));

				//determine which fields to carry over
				const ret = {};
				keys.forEach(key => ret[key] = element[key]);

				return ret;
			})
		;
	}
};

module.exports = {
	books,
	authors
};