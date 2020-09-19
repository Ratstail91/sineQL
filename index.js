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
		try {
			//parse the query
			const tokens = lexify(reqBody, true);
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
	const tokens = lexify(schema, false);
	let pos = 0;

	while (tokens[pos++]) {
		//check for keywords
		switch(tokens[pos - 1]) {
			case 'type':
				graph[tokens[pos++]] = parseCompoundType(tokens, pos);

				//advance to the end of the compound type
				pos = eatBlock(tokens, pos);

				break;

			case 'scalar':
				if (keywords.includes(graph[tokens[pos - 1]])) {
					throw 'Unexpected keyword ' + graph[tokens[pos - 1]];
				}

				graph[tokens[pos++]] = { scalar: true };
				break;

			default:
				throw 'Unknown token ' + tokens[pos - 1];
		}
	}

	return graph;
};

const parseCompoundType = (tokens, pos) => {
	//format check (not strictly necessary, but it looks nice)
	if (tokens[pos] !== '{') {
		throw 'Expected \'{\' in compound type definition';
	}

	//graph component to be returned
	const compound = {};

	//for each line of the compound type
	while (tokens[pos++] && tokens[pos] !== '}') {
		let type = tokens[pos++];
		const name = tokens[pos];

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
			typeName: type
		};
	}

	return compound;
};

const parseQuery = async (handler, tokens, pos, typeGraph, parent = null) => {
	//returns an object result from handler for all custom types

	//determine this type
	let queryType;

	//only read past tokens
	pos++;

	if (typeGraph[tokens[pos - 1]] && typeGraph[tokens[pos - 1]].scalar) {
		queryType = tokens[pos - 1];
	}

	else if (parent && typeGraph[parent.typeName][tokens[pos - 1]]) {
		queryType = typeGraph[parent.typeName][tokens[pos - 1]].typeName;
	} else {
		queryType = tokens[pos - 1];
	}

	if (tokens[pos++] != '{') {
		throw 'Expected \'{\' after queried type';
	}

	//the scalars to pass to the handler - these are NEIGHBOURS in the hierarchy
	const scalarFields = [];
	const deferredCalls = []; //functions (promises) that will be called at the end of this function

	while(tokens[pos++] && tokens[pos - 1] !== '}') { //while not at the end of this block
		let match = false;

		if (tokens[pos - 1] === 'match') {
			match = true;
			pos++;
		}

		//prevent using keywords
		if (keywords.includes(tokens[pos - 1])) {
			throw 'Unexpected keyword ' + tokens[pos - 1];
		}

		//type is a scalar, and can be queried
		if (typeGraph[queryType] && typeGraph[queryType][tokens[pos - 1]] && typeGraph[typeGraph[queryType][tokens[pos - 1]].typeName].scalar) {
			//push the scalar object to the queryFields
			scalarFields.push({ typeName: typeGraph[queryType][tokens[pos - 1]].typeName, name: tokens[pos - 1], match: match ? tokens[pos++] : null });

			//if I am a scalar child of a match amd I do not match
			if (parent && parent.match && !match) {
				throw 'Broken match chain in scalar type ' + tokens[pos - 1];
			}
		}

		else if (typeGraph[queryType] && typeGraph[queryType][tokens[pos - 1]] && !typeGraph[typeGraph[queryType][tokens[pos - 1]].typeName].scalar) {
			const pos2 = pos; //cache the value to keep it from changing

			//recurse
			deferredCalls.push(async (result) => {
				//if I am a compound child of a match amd I do not match
				if (parent && parent.match && !match) {
					throw 'Broken match chain in compound type ' + tokens[pos2 - 1];
				}

				const [queryResult, dummyPos] = await parseQuery(
					handler,
					tokens,
					pos2 - 1,
					typeGraph,
					{ typeName: queryType, scalars: scalarFields, context: result, match: match } //parent object (this one)
				);

				return [tokens[pos2 - 1], queryResult, match]; //HACK: match piggybacking on the tuple
			});

			pos = eatBlock(tokens, pos + 2);
		} else {
			//token is something else?
			throw 'Found something not in the type graph: ' + tokens[pos - 1] + " " + (pos - 1);
		}
	}

	//eat the end bracket
	if (tokens[pos - 1] !== '}') {
		throw 'Expected \'}\' at the end of query (found ' + tokens[pos - 1] + ')';
	}

	if (!handler[queryType]) {
		throw 'Unrecognized type ' + queryType;
	}

	let results = handler[queryType](parent, scalarFields);

	//WTF: related to the recusion above
	results = await Promise.all(results.map(async res => {
		const tuples = await Promise.all(deferredCalls.map(async call => await call(res)));

		if (!tuples.every(tuple => !tuple[2] || tuple[1].length > 0)) {
			return [];
		}

		tuples.forEach(tuple => res[tuple[0]] = tuple[1]);

		return res;
	}));

	results = results.filter(r => Array.isArray(r) && r.length == 0 ? false : true);
	return [results, pos];
};

//utils
const checkAlphaNumeric = (str) => {
	if (!/^[_a-z][_a-z0-9]*$/i.test(str)) {
		throw 'Unexpected string ' + str;
	}
};

const eatBlock = (tokens, pos) => {
	while (tokens[pos++] && tokens[pos - 1] !== '}') {
		if (tokens[pos] == '{') {
			pos = eatBlock(tokens, pos);
		}
	}

	if (tokens[pos - 1] !== '}') { //eat the final '}'
		throw 'Expected \'}\' while eating block (found ' + tokens[pos - 1] + ')';
	}

	return pos;
};

const lexify = (body, allowStrings) => {
	let current = 0;
	tokens = [];

	while(body[current++]) {
		switch(body[current - 1]) {
			case '{':
			case '}':
				//push just this symbol
				tokens.push(body.substring(current - 1, current));
				break;

			case '"': {
				if (!allowStrings) {
					throw 'Can\'t lex strings';
				}

				const start = current;
				while (body[current++] !== '"') { //find the terminating '
					if (!body[current - 1]) {
						throw 'Unterminated string';
					}
				}
				tokens.push(body.substring(start, current - 1));
				break;
			}

			default: {
				//ignore whitespace
				if (/\s/.test(body[current - 1])) {
					break;
				}

				//anything else is a multi-character token
				const start = current;
				while(body[current] && !/[{}"\s]/.test(body[current])) {
					current++;
				}
				tokens.push(body.substring(start - 1, current));
				break;
			}
		}
	}

	return tokens;
};

//return
module.exports = main;
