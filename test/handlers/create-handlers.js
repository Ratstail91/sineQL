const { Op } = require('sequelize');
const { books, authors } = require('../database/models');

//TODO: 'unique' may be a useful modifier, but not at this stage of development

//The create handlers are supposed to handle inserting new data into a database
//You don't have to create all associated books at the same time as the authors - you can use update later to join them

//You can use the '[' and ']' symbols to create mutliple elements of data at once

//'create' also counts as a modifier, indicating that a specific value is new to the database, and returning an error if it exists already OR
//'match' is used when an existing value must already exist in the database, and returning an error if it does not OR
//if no modifiers are specified, 'set' is used as a fallback (query for compounds, create if not found)

/* possible create requests include:

create Author {
	name "Sydney Sheldon"
	create books [
		{
			title "The Naked Face"
			published 1970
		}
		{
			title "A Stranger in the Mirror"
			published 1976
		}
	]
}

create Author {
	name "Sydney Sheldon"
	create books {
		title "Bloodline"
		published 1977
	}
}

*/

/* all create arguments look like this:

//Author array
[{
	typeName: 'Author',
	name: { typeName: 'String', scalar: true, create: 'Sydney Sheldon' }
	books: [{
		typeName: 'Book',
		create: true,
		title: { typeName: 'String', scalar: true, create: 'Bloodline' }
		published: { typeName: 'Date', scalar: true, set: 1977 }
	}, ...]
},
...]

*/

//higher level elements need to pass their IDs to sub-elements
const createHandlers = {
	//complex compound
	Author: async (create, graph) => {
		//apply the following to an array of authors
		const promises = create.map(async author => {
			//get the fields alone
			const { typeName, create, match, set, ...fields } = author;

			//if we are creating a new element (default with Author as a top-level only type)
			if (create) {
				//check the created scalar fields (value must not exist in the database yet)
				const createdOrs = Object.keys(fields).filter(field => fields[field].scalar && fields[field].create).map(field => { return { [field]: fields[field].create }; });

				const createdFound = await authors.findOne({
					where: {
						[Op.or]: createdOrs
					},
				});

				if (createdFound) {
					//enter error state
					Object.keys(fields).forEach(field => {
						if (fields[field].create == createdFound[field]) {
							throw `Cannot create Author ${field} with value ${fields[field].create} (value already exists)`;
						}
					});

					//no error field found, continue?
				}

				//create the element
				const args = {};
				Object.keys(fields).filter(field => fields[field].scalar).forEach(field => args[field] = fields[field].create || fields[field].set);
				const createdAuthor = await authors.create(args);

				//pass on to the books
				Object.keys(fields).filter(field => !fields[field].scalar).forEach(nonScalar => fields[nonScalar].forEach(element => element.authorId = createdAuthor.id));
				Object.keys(fields).filter(field => !fields[field].scalar).forEach(nonScalar => {
					//delegation
					createHandlers[graph[typeName][nonScalar].typeName](fields[nonScalar], graph);
				});
			}

			//if we are matching an existing element
			else if (match) {
				//check the matched scalar fields (value must exist in the database)
				const matchedAnds = Object.keys(fields).filter(field => fields[field].scalar && fields[field].match).map(field => { return { [field]: fields[field].match }; });

				//these only match one
				const matchedFound = await authors.findOne({
					where: {
						[Op.and]: matchedAnds
					}
				});

				if (!matchedFound) {
					throw `Cannot match Author (no match exists)`;
				}

				//pass on to the books
				Object.keys(fields).filter(field => !fields[field].scalar).forEach(nonScalar => fields[nonScalar].forEach(element => element.authorId = matchedAuthor.id));
				Object.keys(fields).filter(field => !fields[field].scalar).forEach(nonScalar => {
					//delegation
					createHandlers[graph[typeName][nonScalar].typeName](fields[nonScalar], graph);
				});
			}

			//get the remaining scalar fields without create or match ('set' by default), not used - just an error
			else if (set) {
				throw 'Set not implemented for create Author';
			}
		});

		//handle promises
		await Promise.all(promises).catch(e => console.error(e));

		return null;
	},

	//simple compound
	Book: async (create, graph) => {
		//TODO: incomplete
		console.log('-----', create)
	}
};

module.exports = createHandlers;