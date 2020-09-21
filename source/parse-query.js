const keywords = require('./keywords.json');
const { eatBlock } = require('./utils');

//returns an object result from handler for all custom types
const parseQuery = async (handler, tokens, pos, typeGraph, parent = null) => {
	//only read past tokens
	pos++;

	//determine this query's supertype
	let queryType;

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

module.exports = parseQuery;