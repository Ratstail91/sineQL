//break the body down into tokens
const parseInput = (body, allowStrings, options) => {
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
					throw 'Can\'t parse strings';
				}

				const start = current;
				while (body[current++] !== '"') { //find the terminating "
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

	if (options.debug) {
		console.log('Input:\n', tokens, '\n');
	}

	return tokens;
};

module.exports = parseInput;
