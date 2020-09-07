const pokemon = require('./pokemon.json');

//the handler routines
const handler = {
	Pokemon: (parent, scalars) => {
		//takes an object which is the result of the parent query, if there is one { typeName: String, scalars: [scalars], context: the parent object, match: I am being matched }
		//takes an array of scalar types as objects: { typeName: 'String', name: 'String', match: filter }
		//must return an array of objects containing the results

		let filteredPokemon = pokemon;

		//if this is a sub-query of Pokemon (a form), use the parent to narrow the search
		if (parent && parent.typeName == 'Pokemon') {
			//filter based on parent object
			filteredPokemon = filteredPokemon.filter(poke => poke.name == parent.context.name);
			filteredPokemon = filteredPokemon[0].forms;
		}

		//if this query has a matched scalar, filter by that match
		filteredPokemon = filteredPokemon.filter(poke => {
			return scalars.every(s => {
				if (!s.match) {
					return true;
				}

				if (typeof poke[s.name] == 'string') {
					return poke[s.name].toUpperCase() === s.match.toUpperCase(); //other filter methods, such as ranges of numbers, can also be implemented
				}

				if (typeof poke[s.name] == 'number') {
					return poke[s.name] == s.match;
				}

				//handle form-only pokemon
				if (typeof poke[s.name] == 'undefined') {
					return false;
				}

				throw 'Unknown match type in Pokemon handler';
			});
		});

		//return all pokemon fields after filtering
		const fields = scalars.map(s => s.name);
		return filteredPokemon.map(p => {
			const ret = {};

			if (fields.includes('name')) {
				ret.name = p.name;
			}

			if (fields.includes('height')) {
				ret.height = p.height;
			}

			if (fields.includes('weight')) {
				ret.weight = p.weight;
			}

			return ret;
		});
	},

	Stats: (parent, scalars) => {
		if (!parent || parent.typeName != 'Pokemon') {
			throw 'Stats must be inside a Pokemon query';
		}

		let filteredPokemon = pokemon.filter(poke => poke.base_stats !== null); //skip unknown pokemon stats

		//if this is a sub-query of Pokemon, use the parent to narrow the search
		filteredPokemon = filteredPokemon.filter(poke => poke.name == parent.context.name);

		//handle forms
		if (filteredPokemon.length == 0) {
			filteredPokemon = pokemon.filter(poke => poke.base_stats !== null); //skip unknown pokemon stats
			filteredPokemon = filteredPokemon.filter(poke => {
				return poke.forms.some(form => form.name == parent.context.name)
			});

			filteredPokemon = filteredPokemon[0].forms.filter(form => form.name == parent.context.name);
		}

		//return all pokemon fields after filtering
		const fields = scalars.map(s => s.name);
		return filteredPokemon.map(p => {
			const ret = {};

			if (fields.includes('hp')) {
				ret.hp = p.base_stats.hp;
			}

			if (fields.includes('attack')) {
				ret.attack = p.base_stats.attack;
			}

			if (fields.includes('defense')) {
				ret.defense = p.base_stats.defense;
			}

			if (fields.includes('specialAttack')) {
				ret.specialAttack = p.base_stats.specialAttack;
			}

			if (fields.includes('specialDefense')) {
				ret.specialDefense = p.base_stats.specialDefense;
			}

			if (fields.includes('speed')) {
				ret.speed = p.base_stats.speed;
			}

			return ret;
		});
	},

	create: (matches, sets) => {
		//TODO
	},

	update: (matches, sets) => {
		//TODO
	},

	delete: matches => {
		//TODO
	},
};

module.exports = handler;
