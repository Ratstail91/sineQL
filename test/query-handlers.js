const { Op } = require('./mock-sequelize');
const { books, authors } = require('./mock-models');

//the handler functions return arrays for each type, containing every element that satisfies the queries

//the "query" argument contains the object built from the sineQL query
//the "graph" argument contains the typeGraph

//the task of the handler functions is to query the database, and return the correct results

/* possible values for "query" include:

{
	id: 1,
	typeName: 'Author',
	name: { typeName: 'String', scalar: true, match: 'Kenneth Grahame' },
	books: { typeName: 'Book', match: {
		id: 2,
		typeName: 'Book',
		title: { typeName: 'String', scalar: true, match: 'The Wind in the Willows' }
		published: { typeName: 'Date', scalar: true }
	}
}

*/

//depth-first search seems to be the best option
//Each query shouldn't know if it's a sub-query

const queryHandlers = {
	//complex compound
	Author: async (query, graph) => {
		//get the fields alone
		const { typeName, ...fields } = query;

		//hack the id into the fields list (if it's not there already)
		fields['id'] = fields['id'] || { typeName: 'Integer', scalar: true }; //TODO: should this be default?

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

module.exports = queryHandlers;