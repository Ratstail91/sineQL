const database = require('./database.js');

/* DOCS: The handler module connects the database to simpleQL.
 * this will be user-implemented, but for now uses a fake database provided in database.js
 * The 'scalars' will be objects containing a name and the type for each scalar field requested by a query.
 * This can be used in several ways...
 *
 * The handlers should only handle scalar fields - compound fields will be queried separately by simpleQL.
*/

//the handler routines
const handler = {
	Book: (parent, scalars) => {
		//takes an object which is the result of the parent query, if there is one { typeName: 'Author', scalars: [scalars] }
		//takes an array of scalar types as objects: { typeName: 'String', name: 'title' }
		//must return an array of objects containing the results

		let books = database.books;

		//if this is a sub-query, use the parent to narrow the search
		if (parent && parent.typeName == 'Author') {
			//filter based on parent object
			books = books.filter(b => b.author.name == parent.context.name);
		}

		//return all books
		const fields = scalars.map(s => s.name);
		return books.map(b => {
			const ret = {};

			if (fields.includes('title')) {
				ret.title = b.title;
			}

			if (fields.includes('published')) {
				ret.published = b.published;
			}

			return ret;
		});
	},

	Author: (parent, scalars) => {
		let authors = database.authors;

		//if this is a sub-query, use the parent to find the author
		if (parent && parent.typeName == 'Book') {
			const author = authors.find(a => a.books.filter(b => b.title == parent.context.title).length > 0);

			//ensure only the named scalars are returned (hack)
			const ret = {};
			if (scalars.filter(s => s.name == 'name').length > 0) {
				ret.name = author.name;
			}

			return [ret]; //must return an array
		}

		//return all authors
		const fields = scalars.map(s => s.name);
		return authors.map(a => {
			const ret = {};

			if (fields.includes('name')) {
				ret.name = a.name;
			}

			return ret;
		});
	},

	create: (matches, sets) => {
		//TODO
	},

	update: (matches, sets) => {
		//TODO
	},

	delete: matches => {
		//TODO
	},
};

module.exports = handler;
