//build the tokens into a single object of types representing the initial query
const parseCreateTree = (tokens, typeGraph, options = {}) => {
	let current = 1; //primed

	//check this is a create command
	if (tokens[current - 1] != 'create') {
		throw 'Expected create keyword at the beginning of create command';
	}

	current++;

	//get a token that matches a type
	if (!typeGraph[tokens[current - 1]]) {
		throw `Expected a type in the type graph (found ${tokens[current - 1]})`;
	}

	//check that there are the correct number of '{' and '}'
	if (tokens.reduce((running, tok) => tok == '{' ? running + 1 : tok == '}' ? running - 1 : running, 0) != 0) {
		throw `Unequal number of '{' and '}' found`;
	}

	//check that there are the correct number of '[' and ']'
	if (tokens.reduce((running, tok) => tok == '[' ? running + 1 : tok == ']' ? running - 1 : running, 0) != 0) {
		throw `Unequal number of '[' and ']' found`;
	}

	//the return
	const result = [];
	const type = tokens[current - 1];

	if (tokens[current] == '[') {
		current++;
	}

	do {
		//read the block of lines
		const [block, pos] = readBlock(tokens, current, type, typeGraph, options);

		//insert the typename into the top-level block
		block['typeName'] = type;

		//insert create into the top-level block
		block['create'] = true;

		current = pos;

		result.push(block);
	} while (tokens[current] && tokens[current] != ']');

	//finally
	return result;
};

const readBlock = (tokens, current, superType, typeGraph, options) => {
	//scan the '{'
	if (tokens[current++] != '{') {
		throw `Expected '{' at beginning of a block (found ${tokens[current - 1]})`;
	}

	//result
	const result = {};

	//scan each "line" in this block
	while(tokens[current++] && tokens[current - 1] != '}') {
		//check for block-level keywords (modifiers need to form a chain from the leaf)
		let modifier = null;
		if (['create', 'match'].includes(tokens[current - 1])) {
			modifier = tokens[current - 1];
			current++;
		}

		//read field name
		const fieldName = tokens[current - 1];

		if (options.debug) {
			console.log(`Trying to process field ${fieldName}`);
		}

		//if the field is not present in the type
		if (!typeGraph[superType][fieldName]) {
			throw `Unexpected field name ${fieldName} in type ${superType}`;
		}

		//if the field is non-scalar, read the sub-block
		if (!typeGraph[typeGraph[superType][fieldName].typeName].scalar) {
			if (tokens[current] == '[') {
				current++;
			}

			do {
				//recurse
				const [block, pos] = readBlock(tokens, current, typeGraph[superType][fieldName].typeName, typeGraph, options);

				//insert the typename into the block
				block['typeName'] = typeGraph[superType][fieldName].typeName;

				//insert the unique modifier if it's set
				block['unique'] = typeGraph[superType][fieldName].unique;

				//insert the block-level modifier signal
				if (modifier) {
					block[modifier] = true;
				} else {
					throw `Modifier expected for ${fieldName} (either create or match)`;
				}

				//insert into result
				result[fieldName] = result[fieldName] || [];
				result[fieldName].push(block);

				current = pos; //pos points past the end of the block

				if (options.debug) {
					console.log(`${fieldName}:`);
					console.dir(result[fieldName], { depth: null });
				}
			} while (tokens[current] && tokens[current] == '{');
			current++;

			continue;
		}

		//scalar
		else {
			//save the typeGraph type into result
			result[fieldName] = JSON.parse(JSON.stringify( typeGraph[ typeGraph[superType][fieldName].typeName ] ));

			//insert the unique modifier if it's set
			result[fieldName]['unique'] = typeGraph[superType][fieldName].unique;

			//insert the block-level modifier signal
			if (modifier) {
				result[fieldName][modifier] = tokens[current++];
			} else {
				result[fieldName]['set'] = tokens[current++];
			}

			if (options.debug) {
				console.log(`${fieldName}: `, result[fieldName]);
			}

			continue;
		}
	}

	return [result, current];
};

module.exports = parseCreateTree;