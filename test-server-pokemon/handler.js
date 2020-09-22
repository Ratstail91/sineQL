/* DOCS: handler parameter types
parent: Type | null
scalars: [{ typeName: String, name: String, filter: any | null }, ...]
matching: Boolean
*/

const database = require('./pokemon.json');

//the handler routines
const handler = {
	Pokemon: (parent, scalars, matching) => {
		throw 'Nothing here is working';

		let pokemon = database;

		//if this is a sub-query of Pokemon (a form), use the parent to narrow the search
		if (parent && parent.typeName == 'Pokemon') {
			//filter based on parent object + scalars
			pokemon = pokemon.filter(poke => {
				return scalars.every(scalar => poke[scalar.name] == parent.context[scalar.name]);
			});

			pokemon = pokemon.map(poke => poke.forms)[0];
		}

		//I am being matched (if true, ALL present scalars will have a filter field)
		if (matching) {
			//check every scalar to every poke - a single false match is a miss on that poke
			pokemon = pokemon.filter(poke => {
				return scalars.every(scalar => {
					//handle each type of scalar
					switch (scalar.typeName) {
						case 'String':
						case 'Integer':
						case 'Float':
						case 'Boolean':
							return poke[scalar.name].toString() == scalar.filter; //dumb comparison for now

						default:
							throw `Unknown scalar typeName in handler: ${scalar.typeName} (${scalar.name})`;
					}
				});
			});

			//if there are no pokemon left, then the filters missed matches
			if (pokemon.length == 0) {
				return [];
			}
		}

		//scalars are being matched on their own
		if (scalars.some(s => s.filter)) {
			//check every scalar to every poke - a single match is a hit
			pokemon = pokemon.filter(poke => {
				return scalars.some(scalar => {
					//handle each type of scalar
					switch (scalar.typeName) {
						case 'String':
						case 'Integer':
						case 'Float':
						case 'Boolean':
							console.log(scalar, poke[scalar.name]);
							return poke[scalar.name].toString() == scalar.filter; //dumb comparison for now

						default:
							throw `Unknown scalar typeName in handler: ${scalar.typeName} (${scalar.name})`;
					}
				});
			});

			//if there are no pokemon left, then the filters missed matches
			if (pokemon.length == 0) {
				return [];
			}
		}

		//process (filter out unwanted fields) and return the array of pokemon
		return pokemon.map(poke => {
			let ret = {};

			//that's a big O(damn)
			scalars.forEach(scalar => {
				ret[scalar.name] = poke[scalar.name];
			});

			return ret;
		});
	},

	Stats: (parent, scalars, matching) => {
		throw 'Nothing here is working';

		if (!parent || parent.typeName != 'Pokemon') {
			throw 'Stats must be inside a Pokemon query';
		}

		console.log(parent.scalars, scalars);

		//skip unknown/empty pokemon stats
		let pokemon = database.filter(poke => poke.base_stats != null);

		//if this is a sub-query of Pokemon (already checked), use the parent to narrow the search
		pokemon = pokemon.filter(poke => {
			return scalars.every(scalar => poke[scalar.name] == parent.context[scalar.name]);
		});

		//handle forms instead of normal queries
		if (pokemon.length == 0) {
			pokemon = database.filter(poke => poke.base_stats != null);//skip unknown/empty pokemon stats

			pokemon = pokemon.map(p => p.forms);
			pokemon = [].concat(...pokemon);

			pokemon = pokemon.filter(poke => {
				return poke.forms.some(form => {
					return scalars.every(scalar => form[scalar.name] == parent.context[scalar.name]);
				});
			});
		}

		//I am being matched (if true, ALL present scalars will have a filter field)
		if (matching) {
			//check every scalar to every poke - a single false match is a miss on that poke
			pokemon = pokemon.filter(poke => {
				return scalars.every(scalar => {
					//handle each type of scalar
					switch (scalar.typeName) {
						case 'Integer':
							return poke.base_stats[scalar.name] === parseInt(scalar.filter); //dumb comparison for now

						default:
							throw `Unhandled scalar typeName in Stats handler: ${scalar.typeName} (${scalar.name})`;
					}
				});
			});

			//if there are no pokemon left, then the filters missed matches
			if (pokemon.length == 0) {
				return [];
			}
		}

		//scalars are being matched on their own
		if (scalars.some(s => s.filter)) {
			//check every scalar to every poke - a single match is a hit
			pokemon = pokemon.filter(poke => {
				return scalars.some(scalar => {
					//handle each type of scalar
					switch (scalar.typeName) {
						case 'Integer':
							return poke.base_stats[scalar.name] === parseInt(scalar.filter); //dumb comparison for now

						default:
							throw `Unhandled scalar typeName in Stats handler: ${scalar.typeName} (${scalar.name})`;
					}
				});
			});

			//if there are no pokemon left, then the filters missed matches
			if (pokemon.length == 0) {
				return [];
			}
		}

		//process (filter out unwanted fields) and return the array of pokemon
		return pokemon.map(poke => {
			let ret = {};

			//that's a big O(damn)
			scalars.forEach(scalar => {
				ret[scalar.name] = poke.base_stats[scalar.name];
			});

			return ret;
		});
	},
};

module.exports = handler;
