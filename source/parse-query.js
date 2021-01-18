const keywords = require('./keywords.json');
const { eatBlock } = require('./utils');

//returns an object result from handler for all custom types
const parseQuery = async (handler, tokens, pos, typeGraph, parent = null, superMatching = false) => {
	//only read past tokens
	pos++;

	//determine this query's supertype
	let superType;

	if (!parent) { //top-level
		superType = tokens[pos - 1];
	}

	else if (typeGraph[parent.typeName][ tokens[pos-1] ]) {
		superType = typeGraph[parent.typeName][ tokens[pos-1] ].typeName;
	}

	else {
		throw `Missing supertype in type graph (pos = ${pos})`;
	}

	//error handling
	if (!handler[superType]) {
		throw 'Unrecognized type ' + superType;
	}

	if (tokens[pos++] != '{') {
		throw 'Expected \'{\' after supertype';
	}

	//the scalars to pass to the handler - components of the compound types
	const scalarFields = [];
	const deferredCalls = []; //functions (promises) that will be called at the end of this function

	while(tokens[pos++] && tokens[pos - 1] !== '}') { //while not at the end of this block
		//check for matching flag
		let matching = false;

		if (tokens[pos - 1] === 'match') {
			matching = true;
			pos++;
		}

		//prevent using keywords
		if (keywords.includes(tokens[pos - 1])) {
			throw 'Unexpected keyword ' + tokens[pos - 1];
		}

		//type is a scalar
		if (typeGraph[superType] && typeGraph[superType][tokens[pos - 1]] && typeGraph[typeGraph[superType][tokens[pos - 1]].typeName].scalar) {
			//push the scalar object to the queryFields
			scalarFields.push({ typeName: typeGraph[superType][tokens[pos - 1]].typeName, name: tokens[pos - 1], filter: matching ? tokens[pos++] : null });

			//if I am a scalar child of a match and I do not match
			if (parent && superMatching && !matching) {
				throw 'Broken match chain in scalar type ' + tokens[pos - 1];
			}
		}

		//type is a compound, and must be recursed
		else if (typeGraph[superType] && typeGraph[superType][tokens[pos - 1]]) {
			const pos2 = pos; //cache the value to keep it from changing

			//recurse
			deferredCalls.push(async (result) => {
				//if I am a compound child of a match amd I do not match
				if (parent && superMatching && !matching) {
					throw 'Broken match chain in compound type ' + tokens[pos2 - 1];
				}

				const [queryResult, dummyPos] = await parseQuery(
					handler,
					tokens,
					pos2 - 1,
					typeGraph,
					{ typeName: superType, scalars: scalarFields, context: result }, //parent object (this one)
					matching
				);

				return [tokens[pos2 - 1], queryResult, matching]; //HACK: match piggybacking on the tuple
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

	let results = handler[superType](parent, scalarFields, superMatching);

	//WTF: related to the recusion above (turning the results inside out?)
	results = await Promise.all(results.map(async res => {
		const tuples = await Promise.all(deferredCalls.map(async call => await call(res)));

		if (!tuples.every(tuple => !tuple[2] || tuple[1].length > 0)) {
			return [];
		}

		tuples.forEach(tuple => res[tuple[0]] = tuple[1]);

		return res;
	}));

	results = results.filter(r => !Array.isArray(r) || r.length > 0);

	return [results, pos];
};

module.exports = parseQuery;
