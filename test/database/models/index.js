const sequelize = require('..');
const authors = require('./authors');
const books = require('./books');

books.belongsTo(authors, { as: 'author' }); //books now reference the authorId

sequelize.sync();

module.exports = {
	authors,
	books
};