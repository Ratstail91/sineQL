//the main function to be returned
const main = (schema, handler) => {
	const typeGraph = buildTypeGraph(schema);

	console.log(typeGraph);

	//the receiving function - this will be called multiple times
	return async reqBody => {
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
					const result = await parseQuery(handler, tokens, pos, typeGraph[tokens[pos]], typeGraph);

					return [200, result];

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

const parseQuery = async (handler, tokens, pos, typeGraph, superTypeGraph, parent = null) => {
	//returns an object result from handler

	//get the "parent object" contents for sub-objects
	const queryName = superTypeGraph[tokens[pos]] ? null : tokens[pos]; //if you're a type, name = null
	const queryType = superTypeGraph[tokens[pos]] ? tokens[pos] : superTypeGraph[parent.typeName][tokens[pos]].typeName; //use this type or derive the type from the parent

	//move on
	pos++;

	//the opening brace
	if (tokens[pos++] != '{') {
		throw 'Expected \'{\' in query, found ' + tokens[pos - 1];
	}

	//the scalars to pass to the handler
	const scalarFields = [];
	const deferredCalls = []; //functions (promises) that will be called at the end of this function

	while(tokens[pos] != '}') { //while not at the end of this block
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
			scalarFields.push({ typeName: typeGraph[tokens[pos]].typeName, name: tokens[pos] });

			pos++;
		} else {
			const pos2 = pos; //cache the value to keep it from changing

			//recurse
			deferredCalls.push(async (result) => [tokens[pos2], await parseQuery(
				handler,
				tokens,
				pos2,
				superTypeGraph[typeGraph[tokens[pos2]].typeName],
				superTypeGraph,
				{ typeName: queryType, scalars: scalarFields, context: result }
			)]);

			pos = eatBlock(tokens, pos);
		}
	}

	//eat the end bracket
	pos++;

	let results = handler[queryType](parent, scalarFields);

	results = await Promise.all(results.map(async res => {
		const tuples = await Promise.all(deferredCalls.map(async call => await call(res)));

		tuples.forEach(tuple => res[tuple[0]] = tuple[1]);

		return res;
	}));

	return results;
};

//utils
const checkAlphaNumeric = (str) => {
	if (!/^[_a-z][_a-z0-9]*$/i.test(str)) {
		throw 'Unexpected string ' + str;
	}
};

const eatBlock = (tokens, pos) => {
	while (tokens[pos] && tokens[pos] != '}') {
		if (tokens[pos] == '{') {
			pos = eatBlock(tokens, pos+1);
		} else {
			pos++;
		}
	}

	return pos;
};

//return
module.exports = main;