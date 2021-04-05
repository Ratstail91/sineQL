const { Op } = require('../database');
const { books, authors } = require('../database/models');

//TODO: 'unique' may be a useful modifier, but not at this stage of development

//The create handlers are supposed to handle inserting new data into a database
//You don't have to create all associated books at the same time as the authors - you can use update later to join them

//You can use the '[' and ']' symbols to create mutliple elements of data at once

//'create' also counts as a modifier, indicating that a specific value is new to the database, and returning an error if it exists already OR
//'match' is used when an existing value must already exist in the database, and returning an error if it does not OR
//'set' is used when an existing value may or may not already exist in the database; first it queries, then if it fails to find, creates

//if no modifiers are specified, 'set' is used as a fallback

/* possible create requests include:

create Author {
	create name "Sydney Sheldon"
	create books [
		{
			create title "The Naked Face"
			set published 1970
		}
		{
			create title "A Stranger in the Mirror"
			set published 1976
		}
	]
}

create Author { 
	match name "Sydney Sheldon"
	create books {
		create title "Bloodline"
		published 1977
	}
}

*/

const createHandlers = {
	//complex compound
	Author: async (create, graph) => {
		//
	},

	//simple compound
	Book: async (create, graph) => {
		//
	}
};

modules.exports = createHandlers;