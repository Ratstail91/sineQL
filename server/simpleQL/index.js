//reserved keywords that can't be used as identifiers
const keywords = ['type', 'scalar', 'create', 'update', 'delete', 'set', 'match'];

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
	//returns an object result from handler for all custom types

	//determine this type
	let queryType;

	if (typeGraph[tokens[pos]] && typeGraph[tokens[pos]].scalar) {
		queryType = tokens[pos];
	}

	else if (parent && typeGraph[parent.typeName][tokens[pos]]) {
		queryType = typeGraph[parent.typeName][tokens[pos]].typeName;
	} else {
		queryType = tokens[pos];
	}

	//move on
	pos++;

	if (tokens[pos++] != '{') {
		throw 'Expected \'{\' after queried type';
	}

	//the scalars to pass to the handler
	const scalarFields = [];
	const deferredCalls = []; //functions (promises) that will be called at the end of this function

	while(tokens[pos] && tokens[pos] != '}') { //while not at the end of this block
		//prevent using keywords
		if (keywords.includes(tokens[pos])) {
			throw 'Unexpected keyword ' + tokens[pos];
		}

		//type is a scalar, and can be queried
		if (typeGraph[queryType] && typeGraph[queryType][tokens[pos]] && typeGraph[typeGraph[queryType][tokens[pos]].typeName].scalar) {
			//push the scalar object to the queryFields
			scalarFields.push({ typeName: typeGraph[queryType][tokens[pos]].typeName, name: tokens[pos] });

			pos++;
		}
		else if (typeGraph[queryType] && typeGraph[queryType][tokens[pos]] && !typeGraph[typeGraph[queryType][tokens[pos]].typeName].scalar) {
			const pos2 = pos; //cache the value to keep it from changing

			//recurse
			deferredCalls.push(async (result) => [tokens[pos2], await parseQuery(
				handler,
				tokens,
				pos2,
				typeGraph,
				{ typeName: queryType, scalars: scalarFields, context: result } //parent object
			)]);

			pos = eatBlock(tokens, pos + 2);
		} else {
			//token is something else?
			console.log('something else: ', tokens[pos], pos);
			pos++;
		}
	}

	//eat the end bracket
	pos++;

	let results = handler[queryType](parent, scalarFields);

	//WTF: related to the recusion above
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

	return ++pos; //eat the final '}'
};

//return
module.exports = main;
