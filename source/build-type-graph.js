//reserved keywords that can't be used as identifiers
const keywords = require('./keywords.json');
const { eatBlock, checkAlphaNumeric } = require('./utils');
const parseInput = require('./parse-input');

//parse the schema into a type graph
const buildTypeGraph = (schema, options) => {
	//the default graph
	let graph = {
		String: { typeName: 'String', scalar: true },
		Integer: { typeName: 'Integer', scalar: true },
		Float: { typeName: 'Float', scalar: true },
		Boolean: { typeName: 'Boolean', scalar: true },
	};

	//parse the schema
	const tokens = parseInput(schema, false, options);
	let pos = 0;

	while (tokens[pos++]) {
		//check for keywords
		switch(tokens[pos - 1]) {
			case 'type':
				//delegate
				graph[tokens[pos++]] = parseCompoundType(tokens, pos, Object.keys(graph), { ...options, debugName: tokens[pos - 1] });

				//advance to the end of the compound type
				pos = eatBlock(tokens, pos);

				break;

			case 'scalar':
				//check against keyword list
				if (keywords.includes(tokens[pos])) {
					throw 'Unexpected keyword ' + tokens[pos];
				}

				graph[tokens[pos++]] = { typeName: tokens[pos - 1], scalar: true };

				if (options.debug) {
					console.log(`Defined ${tokens[pos - 1]}:\n`, graph[tokens[pos - 1]]);
				}

				break;

			default:
				throw 'Unknown token ' + tokens[pos - 1];
		}
	}

	if (options.debug) {
		console.log('\nType Graph:\n', graph, '\n');
	}

	return graph;
};

//moved this routine to a separate function for clarity
const parseCompoundType = (tokens, pos, scalars, options) => {
	//format check (not strictly necessary, but it looks nice)
	if (tokens[pos] !== '{') {
		throw 'Expected \'{\' in compound type definition';
	}

	//graph component to be returned
	const compound = { typeName: tokens[pos - 1] };

	//for each line of the compound type
	while (tokens[pos++] && tokens[pos] !== '}') {
		let type = tokens[pos++];
		const name = tokens[pos];

		//no mangled types or names
		checkAlphaNumeric(type);
		checkAlphaNumeric(name);

		//can't use keywords
		if (keywords.includes(type) || keywords.includes(name)) {
			throw `Unexpected keyword found as type field or type name (${type} ${name})`;
		}

		//can only use existing types (prevents looping tree structure)
		if (!scalars.includes(type)) {
			throw `Unexpected value found as type field ('${type}' is undefined)`;
		}

		//check for duplicate fields
		if (Object.keys(compound).includes(name)) {
			throw `Unexpected duplicate field name (${name})`;
		}

		//finally, push to the compound definition
		compound[name] = {
			typeName: type
		};
	}

	if (options.debug) {
		console.log(`Defined ${options.debugName}:\n`, compound);
	}

	return compound;
};

module.exports = buildTypeGraph;
