require('dotenv').config();

//setup database
const sequelize = require('./database');
const { books, authors } = require('./database/models');

//create the dummy data
sequelize.sync().then(() => {
	//*
	sequelize.query('DELETE FROM authors;');
	sequelize.query('DELETE FROM books;');

	authors.bulkCreate([
		{ id: 1, name: 'Diana Gabaldon' },
		{ id: 2, name: 'Emily Rodda' },
		{ id: 3, name: 'Kenneth Grahame' }
	]);

	books.bulkCreate([
		{ id: 1, authorId: 1, title: 'Outlander', published: '1991', rating: 9.5 },
		{ id: 2, authorId: 1, title: 'Dragonfly in Amber', published: '1992', rating: 9.5 },
		{ id: 3, authorId: 1, title: 'Voyager', published: '1993', rating: 9.5 },
		{ id: 4, authorId: 1, title: 'Drums of Autumn', published: '1996', rating: 9.5 },
		{ id: 5, authorId: 1, title: 'The Fiery Cross', published: '2000', rating: 9.5 }, //Incorrect, the correct publish date is 2001
		{ id: 6, authorId: 1, title: 'The Breath of Snow and Ashes', published: '2005', rating: 9.5 },
		{ id: 7, authorId: 1, title: 'An Echo in the Bone', published: '2009', rating: 9.5 },
		{ id: 8, authorId: 1, title: 'Written in my Own Heart\'s Blood', published: '2014', rating: 9.5 },
		{ id: 9, authorId: 1, title: 'Go Tell the Bees That I Am Gone', published: null, rating: 9.5 },
		{ id: 10, authorId: 2, title: 'The Forest of Silence', published: '2000', rating: 9.5 },
		{ id: 11, authorId: 2, title: 'The Lake of Tears', published: '2000', rating: 9.5 },
		{ id: 12, authorId: 2, title: 'The City of Rats', published: '2000', rating: 9.5 },
		{ id: 13, authorId: 2, title: 'The Shifting Sands', published: '2000', rating: 9.5 },
		{ id: 14, authorId: 2, title: 'Dread Mountain', published: '2000', rating: 9.5 },
		{ id: 15, authorId: 2, title: 'The Maze of the Beast', published: '2000', rating: 9.5 },
		{ id: 16, authorId: 2, title: 'The Valley of the Lost', published: '2000', rating: 9.5 },
		{ id: 17, authorId: 2, title: 'Return to Del', published: '2000', rating: 9.5 },
		{ id: 18, authorId: 3, title: 'The Wind in the Willows', published: '1908', rating: 9.5 },
	]);
	//*/
});

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
const schema = require('./handlers/schema');
const queryHandlers = require('./handlers/query-handlers');

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