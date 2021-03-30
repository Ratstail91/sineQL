//mock tools
const Op = {
	eq: 'eq'
};

const books = {
	findAll: async args => {
		let arr = [
			{ id: 1, title: 'The Wind in the Willows', published: '1908-06-15' },
			{ id: 2, title: 'The Fart in the Fronds', published: '1908-06-15' }
		];

		const { attributes, where } = args;

		//TODO: make this more generic
		console.log('books attributes:', attributes);
		console.log('books where', where);

		return arr;
	}
}

const authors = {
	findAll: async args => {
		let arr = [
			{ name: 'Kenneth Grahame', books: [1] },
			{ name: 'Frank', books: [1, 2] },
			{ name: 'Betty', books: [2] }
		];

		const { attributes, where } = args;

		console.log('authors attributes:', attributes);
		console.log('authors where', where);

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

		//these are field names
		const scalars = Object.keys(fields).filter(field => graph[fields[field].typeName].scalar);
		const nonScalars = Object.keys(fields).filter(field => !graph[fields[field].typeName].scalar);

		const authorResults = await authors.findAll({
			attributes: scalars, //fields to find (keys)
			where: where
		}); //sequelize ORM model

		const promiseArray = nonScalars.map(async nonScalar => {
			//delegate to a deeper part of the tree
			const nonScalarArray = await queryHandlers[fields[nonScalar].typeName](fields[nonScalar], graph);

			//for each author, update this non-scalar field with the non-scalar's recursed value
			authorResults.forEach(author => {
				author[nonScalar] = nonScalarArray.filter(ns => author[nonScalar].includes(ns.id));
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
}

type Author {
	String name
	Book books
}
`;

//the library to test
const sineQL = require('../source/index.js');

//run the function in debug mode (builds type graph)
const sine = sineQL(schema, { queryHandlers }, { debug: true });

(async () => {
	const [code, result] = await sine('Author { name match books { match title "The Wind in the Willows" published } }');

	console.log('\n\n', JSON.stringify(result));
})();
