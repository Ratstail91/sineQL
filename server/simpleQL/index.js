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
			switch(tokens[pos++]) {
				case 'create':
				case 'update':
				case 'delete':
					throw 'keyword not implemented';
					//TODO
					break;

				//no leading keyword - regular query
				default:
					const [result] = parseQuery(handler, tokens, pos, typeGraph[tokens[pos - 1]], typeGraph);

					return [200, result];

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
		String: { scalar: true, nullable: true },
		Integer: { scalar: true, nullable: true },
		Float: { scalar: true, nullable: true },
		Boolean: { scalar: true, nullable: true },
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

		//finally, push to the compound definition
		compound[name] = {
			typeName: type,
			array: array,
			nullable: nullable,
		};
	}

	return compound;
};

const parseQuery = (handler, tokens, pos, typeGraph, superTypeGraph) => {
	//cache this for later
	const startPos = pos;

	//the opening brace
	if (tokens[pos++] != '{') {
		throw 'Expected \'{\' in query, found ' + tokens[pos - 1];
	}

	//the fields to pass to the handler
	const queryFields = [];

	//while not at the end
	while (tokens[pos] != '}') {
		//not the end of the query
		if (!tokens[pos]) {
			throw 'Expected field in query, got end';
		}

		//prevent using keywords
		if (['create', 'update', 'delete', 'set', 'match'].includes(tokens[pos])) {
			throw 'Unexpected keyword ' + tokens[pos];
		}

		//type is a scalar, and can be queried
		if (superTypeGraph[typeGraph[tokens[pos]].typeName].scalar) {
			//push the scalar object to the queryFields
			queryFields.push({ typeName: typeGraph[tokens[pos]].typeName, name: tokens[pos] });

			pos++;
		} else {
			//parse the subquery using the correct sub-typegraph
			const [result, increment] = parseQuery(handler, tokens, pos + 1, superTypeGraph[typeGraph[tokens[pos]].typeName], superTypeGraph);

			queryFields.push({ ...typeGraph[tokens[pos]], name: tokens[pos], subquery: handler[typeGraph[tokens[pos]].typeName](result) });

			pos += increment + 1;
		}
	}

	console.log(' handler', queryFields);

	return [queryFields, pos - startPos];
};

//utils
const checkAlphaNumeric = (str) => {
	if (!/^[a-z0-9]+$/i.test(str)) {
		throw 'Unexpected string ' + str;
	}
};

//return
module.exports = main;