//build the tokens into a single object of types representing the initial query
const parseQueryTree = (tokens, typeGraph, options) => {
	let current = 1; //primed

	//TODO: check for top-level keywords

	//get a token that matches a type
	if (!typeGraph[tokens[current - 1]]) {
		throw `Expected a type in the type graph (found ${tokens[current - 1]})`;
	}

	//read the block of lines
	const [block, pos] = readBlock(tokens, current, tokens[current - 1], typeGraph, options);

	//insert the typename into the top-level block
	block['typeName'] = tokens[current - 1];

	//finally
	return block;
};

const readBlock = (tokens, current, superType, typeGraph, options) => {
	//scan the '{'
	if (tokens[current++] != '{') {
		throw `Expected '{'`;
	}

	//result
	const result = {};

	//scan each "line" in this block
	while(tokens[current++]) {
		//check for end of block
		if (tokens[current - 1] == '}') {
			break;
		}

		//check for block-level keywords (modifiers need to form a chain from the leaf)
		let modifier = null;
		if (['match'].includes(tokens[current - 1])) {
			modifier = tokens[current - 1];
			current++;
		}

		//read field name
		const fieldName = tokens[current - 1];

		if (options.debug) {
			console.log(`Trying to process field ${fieldName}`);
		}

		//if the field is non-scalar, read the sub-block
		if (!typeGraph[typeGraph[superType][fieldName].typeName].scalar) {
			//recurse
			const [block, pos] = readBlock(tokens, current, typeGraph[superType][fieldName].typeName, typeGraph, options);

			//insert the typename into the block
			block['typeName'] = typeGraph[superType][fieldName].typeName;

			//insert into result
			result[fieldName] = block;

			//insert the block-level modifier signal
			if (modifier) {
				result[fieldName][modifier] = true;
			}

			current = pos; //pos points past the end of the block

			if (options.debug) {
				console.log(`${fieldName}:`);
				console.dir(result[fieldName], { depth: null });
			}

			continue;
		}

		//scalar
		else {
			//save the typeGraph type into result
			result[fieldName] = JSON.parse(JSON.stringify( typeGraph[ typeGraph[superType][fieldName].typeName ] ));

			//insert the block-level modifier signal
			if (modifier) {
				result[fieldName][modifier] = tokens[current++];
			}

			if (options.debug) {
				console.log(`${fieldName}: `, result[fieldName]);
			}

			continue;
		}
	}

	return [result, current];
};

module.exports = parseQueryTree;