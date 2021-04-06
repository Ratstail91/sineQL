const { Op } = require('sequelize');
const { books, authors } = require('../database/models');

//The create handlers are supposed to handle inserting new data into a database
//You don't have to create all associated books at the same time as the authors - you can use update later to join them

//You can use the '[' and ']' symbols to create mutliple elements of data at once

//'create' also counts as a modifier, indicating that a specific value is new to the database, and returning an error if it exists already OR
//'match' is used when an existing value must already exist in the database, and returning an error if it does not

/* possible create requests include:

create Author {
	create name "Sydney Sheldon"
	create books [
		{
			create title "The Naked Face"
			published 1970
		}
		{
			create title "A Stranger in the Mirror"
			published 1976
		}
	]
}

create Author {
	create name "Sydney Sheldon"
	create books {
		create title "Bloodline"
		create published 1977
	}
}

create Author {
	create name "Sydney Sheldon"
	match books {
		match title "Rage of Angels"
	}
}

*/

/* all create arguments look like this:

//Author array
[{
	typeName: 'Author',
	create: true,
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
			const { typeName, create, match, ...fields } = author;

			//if we are creating a new element (default with Author as a top-level only type)
			if (create) {
				//check every unique field is being created
				Object.keys(fields).forEach(field => {
					if (graph[typeName][field].unique && !fields[field].create) {
						throw `Must create a new value for unique fields (${typeName} ${field})`;
					}
				})

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
							throw `Cannot create Author field '${field}' with value '${fields[field].create}' (value already exists)`;
						}
					});

					//no error field found, why?
					throw 'Unknown error (createHandlers.Author)';
				}

				//create the element (with created scalar fields)
				const args = {};
				Object.keys(fields).filter(field => fields[field].scalar).forEach(field => args[field] = fields[field].create || fields[field].set);
				const createdAuthor = await authors.create(args);

				//pass on to the sub-objects (books)
				Object.keys(fields).filter(field => !fields[field].scalar).forEach(nonScalar => fields[nonScalar].forEach(element => element.authorId = createdAuthor.id)); //hack in the authorId
				Object.keys(fields).filter(field => !fields[field].scalar).forEach(nonScalar => {
					//delegation
					createHandlers[graph[typeName][nonScalar].typeName](fields[nonScalar], graph);
				});
			}

			//just to check
			else {
				throw `Fall through not implemented for Author (missed create & match)`;
			}
		});

		//handle promises
		await Promise.all(promises).catch(e => console.error(e));

		return null;
	},

	//simple compound
	Book: async (create, graph) => {
		const promises = create.map(async book => {
			//get the fields alone
			const { typeName, authorId, create, match, ...fields } = book;

			//if we are creating a new element(s)
			if (create) {
				//check every unique field is being created
				Object.keys(fields).forEach(field => {
					//authorId is hacked in from above
					if (graph[typeName][field].unique && !fields[field].create) {
						throw `Must create a new value for unique fields (${typeName} ${field})`;
					}
				})

				//check the created scalar fields (value must not exist in the database yet)
				const createdOrs = Object.keys(fields).filter(field => fields[field].scalar && fields[field].create).map(field => { return { [field]: fields[field].create }; });

				const createdFound = await books.findOne({
					where: {
						[Op.or]: createdOrs
					},
				});

				if (createdFound) {
					//enter error state
					Object.keys(fields).forEach(field => {
						if (fields[field].create == createdFound[field]) {
							throw `Cannot create Book field '${field}' with value '${fields[field].create}' (value already exists)`;
						}
					});

					//no error field found, why?
					throw 'Unknown error (createHandlers.Book)';
				}

				//create the element (with created scalar fields)
				const args = {};
				Object.keys(fields).filter(field => fields[field].scalar).forEach(field => args[field] = fields[field].create || fields[field].set);
				args['authorId'] = authorId; //hacked in
				await books.create(args);
			}

			//pulled from query (match existing books)
			else if (match) {
				//get the names of matched fields
				const matchedNames = Object.keys(fields).filter(field => fields[field].match || fields[field].set);

				//short-circuit if querying everything
				const where = {};
				if (matchedNames.length > 0) {
					//build the "where" object
					matchedNames.forEach(mn => {
						if (fields[mn].match !== true) {
							where[mn] = { [Op.eq]: fields[mn].match || fields[mn].set };
						}
					});
				}

				//don't steal books
				where['authorId'] = { [Op.eq]: null };

				//update the sub-elements
				await books.update({
					authorId: authorId
				}, {
					where: where
				}); //sequelize ORM model
			}

			//just to check
			else {
				throw `Fall through not implemented for Book (missed create & match)`;
			}
		});

		//handle promises
		await Promise.all(promises).catch(e => console.error(e));

		return null;
	}
};

module.exports = createHandlers;