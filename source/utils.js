//legal identifiers can only begin with letters or underscore - can contain numbers otherwise
const checkAlphaNumeric = (str) => {
	if (!/^[_a-z][_a-z0-9]*$/i.test(str)) {
		throw 'Unexpected string ' + str;
	}
};

//eats a "block" from the tokens list
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

module.exports = {
	checkAlphaNumeric,
	eatBlock,
}