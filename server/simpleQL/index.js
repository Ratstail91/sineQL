//the main function to be returned
const main = (schema, handler) => {
	const typeGraph = buildTypeGraph(schema);

	console.log(typeGraph);

	//the receiving function - this will be called multiple times
	return reqBody => {
		//parse the query
		const tokens = reqBody.split(/(\s+)/).filter(s => s.trim().length > 0);
		let pos = 0;

		try {
			//check for keywords
			switch(tokens[pos]) {
				case 'create':
				case 'update':
				case 'delete':
					throw 'keyword not implemented: ' + tokens[pos];
					//TODO
					break;

				//no leading keyword - regular query
				default:
					parseQuery(handler, tokens, pos, typeGraph);

					return [200, ''];

					//TODO
					break;
			}
		}
		catch(e) {
			console.log('caught', e);
			return [400, e.stack || e];
		}
	};
};

//parse the schema into a type graph
const buildTypeGraph = schema => {
	//the default graph
	let graph = {
		String: { scalar: true },
		Integer: { scalar: true },
		Float: { scalar: true },
		Boolean: { scalar: true },
	};

	//parse the schema
	const tokens = schema.split(/(\s+)/).filter(s => s.trim().length > 0);
	let pos = 0;

	while (tokens[pos]) {
		//check for keywords
		switch(tokens[pos++]) {
			case 'type':
				graph[tokens[pos]] = parseCompoundType(tokens, pos);

				//advance to the end of the compound type
				while(tokens[pos] && tokens[pos++] != '}');

				break;

			case 'scalar':
				if (['type', 'scalar'].includes(graph[tokens[pos]])) {
					throw 'Unexpected keyword ' + graph[tokens[pos]];
				}

				graph[tokens[pos++]] = { scalar: true };
				break;

			default:
				throw 'Unknown token ' + tokens[pos -1];
		}
	}

	return graph;
};

const parseCompoundType = (tokens, pos) => {
	pos++; //eat the compound name

	//format check (not strictly necessary, but it looks nice)
	if (tokens[pos++] != '{') {
		throw 'Expected \'{\' in compound type definition';
	}

	//graph component to be returned
	const compound = {};

	//for each line of the compound type
	while (tokens[pos] && tokens[pos] != '}') {
		let type = tokens[pos++];
		const name = tokens[pos++];

		//parse the extra typing data
		let array = false;
		let nullable = true;

		//not nullable
		if (type[0] === '!') {
			nullable = false;
			type = type.slice(1);
		}

		//is array
		if (type.endsWith('[]')) {
			array = true;
			type = type.slice(0, type.length - 2);
		}

		//no mangled types or names
		checkAlphaNumeric(type);
		checkAlphaNumeric(name);

		//can't use keywords
		if (['type', 'scalar'].includes(type) || ['type', 'scalar'].includes(name)) {
			throw 'Unexpected keyword found as type field or type name';
		}

		//check for duplicate fields
		if (Object.keys(compound).includes(name)) {
			throw 'Unexpected duplicate filed name';
		}

		//finally, push to the compound definition
		compound[name] = {
			typeName: type,
			array: array,
			nullable: nullable,
		};
	}

	return compound;
};

const parseQuery = (handler, tokens, pos, typeGraph) => {
	//TODO
};

//utils
const checkAlphaNumeric = (str) => {
	if (!/^[_a-z][_a-z0-9]*$/i.test(str)) {
		throw 'Unexpected string ' + str;
	}
};

//return
module.exports = main;