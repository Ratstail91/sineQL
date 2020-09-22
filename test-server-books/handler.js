/* DOCS: parameter types
parent: Type | null
scalars: [{ typeName: String, name: String, filter: any | null }, ...]
matching: Boolean
*/

const database = require('./database.js');

//the handler routines
const handler = {
	//type queries
	Author: (parent, scalars, matching) => {
		console.log("Author", parent ? parent.context : null);

		let authors;

		//check parentage
		if (parent) {
			//find the author(s) of the parent Book object
			authors = database.authors.filter(author => author.books.some(b => b.title == parent.context.title));
		} else {
			authors = database.authors;
		}

		//I am being matched (if true, ALL present scalars will have a filter field)
		if (matching) {
			//check every scalar to every author - a single false match is a miss on that author
			authors = authors.filter(author => {
				return scalars.every(scalar => {
					//handle each type of scalar
					switch (scalar.typeName) {
						case 'String':
						case 'Integer':
						case 'Float':
						case 'Boolean':
							return author[scalar.name] == scalar.filter; //dumb comparison for now

						//custom handling
						//NOTE: Only books used the `Date` scalar

						default:
							throw `Unknown scalar typeName in handler: ${scalar.typeName} (${scalar.name})`;
					}
				});
			});

			//if there are no authors left, then the book's filters missed matches
			if (authors.length == 0) {
				return [];
			}
		}

		//scalars are being matched on their own
		if (scalars.some(s => s.filter)) {
			//check every scalar to every author - a single match is a hit
			authors = authors.filter(author => {
				return scalars.some(scalar => {
					//handle each type of scalar
					switch (scalar.typeName) {
						case 'String':
						case 'Integer':
						case 'Float':
						case 'Boolean':
							return author[scalar.name] == scalar.filter; //dumb comparison for now

						//custom handling
						//NOTE: Only books used the `Date` scalar

						default:
							throw `Unknown scalar typeName in handler: ${scalar.typeName} (${scalar.name})`;
					}
				});
			});

			//if there are no authors left, then the book's filters missed matches
			if (authors.length == 0) {
				return [];
			}
		}

		//process (filter out unwanted fields) and return the array of authors
		return authors.map(author => {
			let ret = {};

			//that's a big O(damn)
			scalars.forEach(scalar => {
				ret[scalar.name] = author[scalar.name];
			});

			return ret;
		});
	},

	Book: (parent, scalars, matching) => {
		console.log("Book", parent ? parent.context : null);

		let books;

		//check parentage
		if (parent) {
			//find the books of the parent author object
			books = database.books.filter(book => book.authors.some(a => a.name == parent.context.name));
		} else {
			books = database.books;
		}

		//I am being matched (if true, ALL present scalars will have a filter field)
		if (matching) {
			//check every scalar to every book - a single false match is a miss on that book
			books = books.filter(book => {
				return scalars.every(scalar => {
					//handle each type of scalar
					switch (scalar.typeName) {
						case 'String':
						case 'Integer':
						case 'Float':
						case 'Boolean':
							return book[scalar.name] == scalar.filter; //dumb comparison for now

						//custom handling
						case 'Date':
							return book[scalar.name] == scalar.filter; //could have a more complex comparator function, like date-ranges

						default:
							throw `Unknown scalar typeName in handler: ${scalar.typeName} (${scalar.name})`;
					}
				});
			});



			//if there are no books left, then the authos's filters missed matches
			if (books.length == 0) {
				return [];
			}
		}

		//scalars are being matched on their own
		if (scalars.some(s => s.filter)) {
			//check every scalar to every author - a single match is a hit
			books = books.filter(author => {
				return scalars.some(scalar => {
					//handle each type of scalar
					switch (scalar.typeName) {
						case 'String':
						case 'Integer':
						case 'Float':
						case 'Boolean':
							return author[scalar.name] == scalar.filter; //dumb comparison for now

						//custom handling
						//NOTE: Only books used the `Date` scalar

						default:
							throw `Unknown scalar typeName in handler: ${scalar.typeName} (${scalar.name})`;
					}
				});
			});

			//if there are no authors left, then the book's filters missed matches
			if (books.length == 0) {
				return [];
			}
		}

		//process (filter out unwanted fields) and return the array of books
		return books.map(book => {
			let ret = {};

			//that's a big O(damn)
			scalars.forEach(scalar => {
				ret[scalar.name] = book[scalar.name];
			});

			return ret;
		});
	},
};

module.exports = handler;
