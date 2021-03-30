const buildTypeGraph = require('./build-type-graph');
const parseInput = require('./parse-input');
const parseQueryTree = require('./parse-query-tree');

//the main function to be returned (sineQL())
const sineQL = (schema, { queryHandlers }, options = {}) => {
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
			const queryTree = parseQueryTree(tokens, typeGraph, options);

			switch(tokens[0]) {
				//check for leading keywords
				case 'create':
				case 'update':
				case 'delete':
					return [501, 'Keyword not implemented: ' + tokens[0]];
					//TODO: implement these keywords
					break;

				//no leading keyword - regular query
				default: {
					const result = await queryHandlers[queryTree.typeName](queryTree, typeGraph);

					if (options.debug) {
						console.log('Query tree results:');
						console.dir(result, { depth: null });
					}

					return [200, result];
				}
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
