const buildTypeGraph = require('./build-type-graph');
const parseInput = require('./parse-input');
const parseQuery = require('./parse-query');

//the main function to be returned (sineQL())
const sineQL = (schema, handler, options = {}) => {
	let typeGraph;

	try {
		typeGraph = buildTypeGraph(schema, options);
	}
	catch(e) {
		console.error('Type Graph Error:', e);
		return null;
	}

	//the receiving function (sine()) - this will be called multiple times
	return async reqBody => {
		try {
			//parse the query
			const tokens = parseInput(reqBody, true, options);
			let pos = 0;

			switch(tokens[pos]) {
				//check for keywords
				case 'create':
				case 'update':
				case 'delete':
					return [501, 'Keyword not implemented: ' + tokens[pos]];
					//TODO: implement these keywords
					break;

				//no leading keyword - regular query
				default:
					//TODO: implement queries
					return [501, 'Queries not implemented'];
			}
		}
		catch(e) {
			console.error('Error:', e);
			return [400, e.stack || e];
		}
	};
};

//return to the caller
module.exports = sineQL;
