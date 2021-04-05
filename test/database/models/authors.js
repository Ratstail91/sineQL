const Sequelize = require('sequelize');
const sequelize = require('..');

module.exports = sequelize.define('authors', {
	id: {
		type: Sequelize.INTEGER(11),
		allowNull: false,
		autoIncrement: true,
		primaryKey: true,
		unique: true
	},

	name: {
		type: Sequelize.STRING,
		unique: true
	}
});
