//mock tools
const books = {
	findAll: async args => {
		let arr = [
			{ title: 'The Wind in the Willows', published: '1908-06-15' }
		];

		const { attributes, where } = args;

		arr = arr.filter(el => !where || el.title == where.title || el.published == where.published); //TODO: fix this

		return arr;
	}
}

const authors = {
	findAll: async args => {
		const arr = [
			{ name: 'Kenneth Grahame', bookIds: [1] },
		];

		const { attributes, where } = args;

		arr = arr.filter(el => !where || el.title == where.title || el.published == where.published); //TODO: fix this

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

const handler = {
	//complex compound
	Author: async (query, graph) => {
		//get the fields alone
		const { typeName, ...fields } = query;

		//get the names of matched fields
		const matchedNames = Object.keys(fields.filter(field => field.match));

		//short-circuit if querying everything
		const where = {};
		if (matchedNames.length > 0) {
			//build the "where" object
			matchedNames.forEach(mn => {
				where[mn] = {
					[Op.eq]: query[mn].match
				}
			});
		}

		//these are field names
		const scalars = Object.keys(fields).filter(field => graph[field.typeName].scalar);
		const nonScalars = Object.keys(fields).filter(field => !graph[field.typeName].scalar);

		const results = await authors.findAll({
			attributes: scalars, //fields to find (keys)
			where: where
		}); //sequelize ORM model

		nonScalars.forEach(nonScalar => {
			//delegate to a deeper part of the tree
			results[nonScalar] = handler[fields[nonScalar].typeName](fields[nonScalar], graph);
		});

		//finally, return the results
		return results;
	},

	//simple compound
	Book: async (query, graph) => {
		//get the fields alone
		const { typeName, ...fields } = query;

		//get the names of matched fields
		const matchedNames = Object.keys(fields.filter(field => field.match));

		//short-circuit if querying everything
		const where = {};
		if (matchedNames.length > 0) {
			//build the "where" object
			matchedNames.forEach(mn => {
				where[mn] = {
					[Op.eq]: query[mn].match
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
}

type Author {
	String name
	Book books
}
`;

//the library to test
const sineQL = require('../source/index.js');

//run the function in debug mode (builds type graph)
const sine = sineQL(schema, handler, { debug: true });
