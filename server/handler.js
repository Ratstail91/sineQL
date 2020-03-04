const database = require('./database.js');

console.log(database);

//the handler routines
const handler = {
	Book: scalars => {
		//takes an array of scalar types as objects: { typeName: 'String', name: 'title' }
		//must return an array of objects containing the results

		return database.books.map(b => {
			const ret = {};

			if (scalars.some(s => s.name == 'title')) {
				ret.title = b.title;
			}

			if (scalars.some(s => s.name == 'author')) {
				ret.author = b.author;
			}

			if (scalars.some(s => s.name == 'published')) {
				ret.published = b.published;
			}

			return ret;
		});
	},

	Author: scalars => {
		//takes an array of scalar types as objects: { typeName: 'String', name: 'name' }
		//must return an array of objects containing the results
	},

	create: (sets, matches) => {
		//TODO
	},

	update: (sets, matches) => {
		//TODO
	},

	delete: matches => {
		//TODO
	},
};

module.exports = handler;