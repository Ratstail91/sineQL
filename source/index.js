const buildTypeGraph = require('./build-type-graph');
const parseInput = require('./parse-input');
const parseQueryTree = require('./parse-query-tree');
const parseCreateTree = require('./parse-create-tree');

//the main function to be returned (sineQL())
const sineQL = (schema, { queryHandlers, createHandlers }, options = {}) => {
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

			switch(tokens[0]) {
				//check for leading keywords
				case 'create':
					if (!createHandlers) {
						return [501, 'Create handlers not implemented'];
					}

					if (!createHandlers[tokens[1]]) {
						throw `Create handler not implemented for that type: ${tokens[1]}`;
					}

					const createTree = parseCreateTree(tokens, typeGraph, options);

					const result = await createHandlers[tokens[1]](createTree, typeGraph);

					return [200, result];

				case 'update':
				case 'delete':
					return [501, 'Keyword not yet implemented: ' + tokens[0]];
					//TODO: implement these keywords
					break;

				//no leading keyword - regular query
				default: {
					if (!queryHandlers) {
						return [501, 'Query handlers not implemented'];
					}

					const queryTree = parseQueryTree(tokens, typeGraph, options);

					if (!queryHandlers[queryTree.typeName]) {
						throw `Query handler not implemented for that type: ${queryTree.typeName}`;
					}

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
