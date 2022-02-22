const buildTypeGraph = require('./build-type-graph');
const parseInput = require('./parse-input');
const parseQueryTree = require('./parse-query-tree');
const parseCreateTree = require('./parse-create-tree');
const parseUpdateTree = require('./parse-update-tree');
const parseDeleteTree = require('./parse-delete-tree');

//the main function to be returned (sineQL())
const sineQL = (schema, { queryHandlers, createHandlers, updateHandlers, deleteHandlers }, options = {}) => {
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
				case 'create': {
					if (!createHandlers) {
						return [405, 'Create handlers not implemented'];
					}

					if (!createHandlers[tokens[1]]) {
						throw `Create handler not implemented for that type: ${tokens[1]}`;
					}

					const createTree = parseCreateTree(tokens, typeGraph, options);

					const result = await createHandlers[tokens[1]](createTree, typeGraph);

					return [200, result];
				}

				case 'update': {
					if (!updateHandlers) {
						return [405, 'Update handlers not implemented'];
					}

					if (!updateHandlers[tokens[1]]) {
						throw `Update handler not implemented for that type: ${tokens[1]}`;
					}

					const updateTree = parseUpdateTree(tokens, typeGraph, options);

					const result = await updateHandlers[tokens[1]](updateTree, typeGraph);

					return [200, result];
				}

				case 'delete': {
					if (!deleteHandlers) {
						return [405, 'Delete handlers not implemented'];
					}

					if (!deleteHandlers[tokens[1]]) {
						throw `Delete handler not implemented for that type: ${tokens[1]}`;
					}

					const deleteTree = parseDeleteTree(tokens, typeGraph, options);

					const result = await deleteHandlers[tokens[1]](deleteTree, typeGraph);

					return [200, result];
				}

				//no leading keyword - regular query
				default: {
					if (!queryHandlers) {
						return [405, 'Query handlers not implemented'];
					}

					if (!queryHandlers[tokens[0]]) {
						throw `Query handler not implemented for that type: ${tokens[0]}`;
					}

					const queryTree = parseQueryTree(tokens, typeGraph, options);

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
			return [400, e];
		}
	};
};

//return to the caller
module.exports = sineQL;
