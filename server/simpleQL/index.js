//reserved keywords that can't be used as identifiers
const keywords = ['type', 'scalar'];

//the main function to be returned
const main = (schema, handler) => {
	let typeGraph;

	try {
		typeGraph = buildTypeGraph(schema);
	}
	catch(e) {
		console.log('caught in typegraph', e);
		return null;
	}

	console.log(typeGraph);

	//the receiving function - this will be called multiple times
	return async reqBody => {
		//parse the query
		const tokens = reqBody.split(/(\s+)/).filter(s => s.trim().length > 0); //TODO: proper token parsing
		let pos = 0;

		try {
			//check for keywords
			switch(tokens[pos]) {
				case 'create':
				case 'update':
				case 'delete':
					throw 'keyword not implemented: ' + tokens[pos];
					//TODO: implement these keywords
					break;

				//no leading keyword - regular query
				default:
					const result = await parseQuery(handler, tokens, pos, typeGraph);

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
	const tokens = schema.split(/(\s+)/).filter(s => s.trim().length > 0); //TODO: proper token parsing
	let pos = 0;

	while (tokens[pos]) {
		//check for keywords
		switch(tokens[pos++]) {
			case 'type':
				graph[tokens[pos]] = parseCompoundType(tokens, pos);

				//advance to the end of the compound type
				pos = eatBlock(tokens, pos + 2); //+2: skip the name & opening bracket

				break;

			case 'scalar':
				if (keywords.includes(graph[tokens[pos]])) {
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
		let required = false;

		//not nullable
		if (type[0] === '!') {
			required = true;
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
		if (keywords.includes(type) || keywords.includes(name)) {
			throw 'Unexpected keyword found as type field or type name (' + type + ' ' + name + ')';
		}

		//check for duplicate fields
		if (Object.keys(compound).includes(name)) {
			throw 'Unexpected duplicate field name';
		}

		//finally, push to the compound definition
		compound[name] = {
			typeName: type,
			array: array,
			required: required,
		};
	}

	return compound;
};

const parseQuery = async (handler, tokens, pos, typeGraph, parent = null) => {
	//returns an object result from handler

	//get the "parent object" contents for sub-objects
//	const queryName = typeGraph[tokens[pos]] ? null : tokens[pos]; //if you're a type, name = null
//	const queryType = typeGraph[tokens[pos]] ? tokens[pos] : typeGraph[parent.typeName][tokens[pos]].typeName; //use this type or derive the type from the parent

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
		if (typeGraph[typeGraph[tokens[pos]].typeName].scalar) {
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
				typeGraph,
				{ typeName: queryType, scalars: scalarFields } //parent object
			)]);

			pos = eatBlock(tokens, pos);
		}
	}

	//eat the end bracket
	pos++;

	let results = handler[queryType](parent, scalarFields);

	//WTF
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

	return ++pos;
};

//return
module.exports = main;
