//input tools
const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

const question = (prompt, def = null) => {
	return new Promise((resolve, reject) => {
		rl.question(`${prompt}${def ? ` (${def})` : ''}> `, answer => {
			//loop on required
			if (def === null && !answer) {
				return resolve(question(prompt, def));
			}

			return resolve(answer || def);
		});
	});
};

//the library to test
const sineQL = require('../source/index.js');

//the arguments to the library
const schema = require('./schema');
const queryHandlers = require('./query-handlers');

//run the setup function to create the closure (creates the type graph)
const sine = sineQL(schema, { queryHandlers }, { debug: false });

//actually ask the question
(async () => {
	while(true) {
		const answer = await question('sineQL');
		const [code, result] = await sine(answer);

		//normal response
		if (code == 200) {
			console.dir(result, { depth: null });
		}
	}
})();