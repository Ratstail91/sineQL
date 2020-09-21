const buildTypeGraph = require('./build-type-graph');
const parseInput = require('./parse-input');
const parseQuery = require('./parse-query');

//the main function to be returned (sineQL())
const main = (schema, handler, options = {}) => {
	let typeGraph;

	try {
		typeGraph = buildTypeGraph(schema, options);
	}
	catch(e) {
		console.log('Type Graph Error:', e);
		return null;
	}

	//the receiving function (sine()) - this will be called multiple times
	return async (reqBody) => {
		try {
			//parse the query
			const tokens = parseInput(reqBody, true, options);
			let pos = 0;

			//check for keywords
			switch(tokens[pos]) {
				case 'create':
				case 'update':
				case 'delete':
					return [501, 'Keyword not implemented: ' + tokens[pos]];
					//TODO: implement these keywords
					break;

				//no leading keyword - regular query
				default:
					const [result, endPos] = await parseQuery(handler, tokens, pos, typeGraph);

					//reject the request, despite finishing processing it
					if (tokens[endPos]) {
						throw 'Unexpected data found at the end of the token list (found ' + tokens[endPos] + ')';
					}

					return [200, result];

					break;
			}
		}
		catch(e) {
			console.log('Error:', e);
			return [400, e.stack || e];
		}
	};
};

//return to the caller
module.exports = main;
