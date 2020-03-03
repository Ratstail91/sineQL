const database = require('./database.js');

console.log(database);

//the handler routines
const handler = {
	Book: scalars => {
		//takes an array of scalar types as objects: { typeName: 'String', name: 'title' }
		//must return an array of objects containing the results
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