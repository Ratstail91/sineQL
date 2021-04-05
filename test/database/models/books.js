const Sequelize = require('sequelize');
const sequelize = require('..');

module.exports = sequelize.define('books', {
	id: {
		type: Sequelize.INTEGER(11),
		allowNull: false,
		autoIncrement: true,
		primaryKey: true,
		unique: true
	},

	title: {
		type: Sequelize.TEXT
	},

	published: {
		type: Sequelize.TEXT
	},

	rating: {
		type: Sequelize.FLOAT
	}
});
