//mock tools
const Op = {
	eq: 'eq'
};

const books = {
	findAll: async args => {
		let arr = [
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

		const { attributes, where } = args;

		//filter out non-matching elements
		arr = arr.filter(element => {
			if (Object.keys(where).length == 0) {
				return true;
			}

			return Object.keys(where).reduce((result, key) => {
				return result && (element[key] || 'null').toString() == where[key].eq.toString();
			}, true);
		});

		//filter out non-used attributes
		arr = arr.map(element => {
			//only they element keys that are in attributes
			const keys = Object.keys(element).filter(key => attributes.includes(key));

			//determine which fields to carry over
			const ret = {};
			keys.forEach(key => ret[key] = element[key]);

			return ret;
		});

		return arr;
	}
}

const authors = {
	findAll: async args => {
		let arr = [
			{ id: 1, name: 'Diana Gabaldon', books: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
			{ id: 2, name: 'Emily Rodda', books: [10, 11, 12, 13, 14, 15, 16, 17] },
			{ id: 3, name: 'Kenneth Grahame', books: [18] }
		];

		const { attributes, where } = args;

		//filter out non-matching elements
		arr = arr.filter(element => {
			if (Object.keys(where).length == 0) {
				return true;
			}

			return Object.keys(where).reduce((result, key) => {
				return result && (element[key] || 'null').toString() == where[key].eq.toString();
			}, true);
		});

		//filter out non-used attributes
		arr = arr.map(element => {
			//only they element keys that are in attributes
			const keys = Object.keys(element).filter(key => attributes.includes(key));

			//determine which fields to carry over
			const ret = {};
			keys.forEach(key => ret[key] = element[key]);

			return ret;
		});

		return arr;
	}
}

//the handler functions return arrays for each type, containing every element that satisfies the queries

//the "query" argument contains the object built from the sineQL query
//the "graph" argument contains the typeGraph

//the task of the handler functions is to query the database, and return the correct results

/* possible values for "query" include:

{
	typeName: 'Author',
	name: { typeName: 'String', scalar: true, match: 'Kenneth Grahame' },
	books: { typeName: 'Book', match: {
		typeName: 'Book',
		title: { typeName: 'String', scalar: true, match: 'The wind in the Willows' }
		published: { typeName: 'Date', scalar: true }
	}
}

*/

//depth-first search seems to be the best option
//Each query shouldn't know if it's a sub-query

const queryHandlers = {
	//complex compound
	Author: async (query, graph) => {
		//DEBUGGING
		// console.log('Author():', query);

		//get the fields alone
		const { typeName, ...fields } = query;

		//hack the id into the fields list (if it's not there already)
		fields['id'] = fields['id'] || { typeName: 'Integer', scalar: true };

		//get the names of matched fields (fields to find)
		const matchedNames = Object.keys(fields).filter(field => fields[field].match);

		//short-circuit if querying everything
		const where = {};
		if (matchedNames.length > 0) {
			//build the "where" object
			matchedNames.forEach(mn => {
				if (query[mn].match !== true) { //true means it's a compound type
					where[mn] = { [Op.eq]: query[mn].match };
				}
			});
		}

		//these are field names
		const scalars = Object.keys(fields).filter(field => graph[fields[field].typeName].scalar);
		const nonScalars = Object.keys(fields).filter(field => !graph[fields[field].typeName].scalar);

		let authorResults = await authors.findAll({
			attributes: Object.keys(fields), //fields to find (keys)
			where: where
		}); //sequelize ORM model

		const promiseArray = nonScalars.map(async nonScalar => {
			//delegate to a deeper part of the tree
			const nonScalarArray = await queryHandlers[fields[nonScalar].typeName](fields[nonScalar], graph);

			//for each author, update this non-scalar field with the non-scalar's recursed value
			authorResults.forEach(author => {
				author[nonScalar] = nonScalarArray.filter(ns => author[nonScalar].includes(ns.id)); //using the hacked-in ID field (JOIN)
			});

			//prune the authors when matching, but their results are empty
			authorResults = authorResults.filter(author => {
				return !(fields[nonScalar].match && author[nonScalar].length == 0);
			});
		});

		await Promise.all(promiseArray);

		//finally, return the results
		return authorResults;
	},

	//simple compound
	Book: async (query, graph) => {
		// console.log('Book():', query);

		//get the fields alone
		const { typeName, ...fields } = query;

		//hack the id into the fields list (if it's not there already)
		fields['id'] = fields['id'] || { typeName: 'Integer', scalar: true }; //TODO: should this be automatic?

		//get the names of matched fields
		const matchedNames = Object.keys(fields).filter(field => fields[field].match);

		//short-circuit if querying everything
		const where = {};
		if (matchedNames.length > 0) {
			//build the "where" object
			matchedNames.forEach(mn => {
				if (query[mn].match !== true) {
					where[mn] = { [Op.eq]: query[mn].match };
				}
			});
		}

		//return the result
		return await books.findAll({
			attributes: Object.keys(fields), //fields to find
			where: where
		}); //sequelize ORM model
	}
};

//the matching schema
const schema = `
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

//input tool
const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

const question = (prompt, def = null) => {
	return new Promise((resolve, reject) => {
		rl.question(`${prompt}${def ? ` (${def})` : ''}> `, answer => {
			//loop on required
			if (def === null && !answer) {
				return resolve(question(prompt, def));
			}

			return resolve(answer || def);
		});
	});
};

//the library to test
const sineQL = require('../source/index.js');

//run the function in debug mode (builds type graph)
const sine = sineQL(schema, { queryHandlers }, { debug: false });

//actually ask the question
(async () => {
	while(true) {
		const answer = await question('sineQL');
		const [code, result] = await sine(answer);

		//normal response
		if (code == 200) {
			console.dir(result, { depth: null });
		}
	}
})();