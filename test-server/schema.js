module.exports = `
type Pokemon {
	String name
	Integer height
	Integer weight
	Stats stats
	Pokemon forms
}

type Stats {
	Integer hp
	Integer attack
	Integer defense
	Integer specialAttack
	Integer specialDefense
	Integer speed
}
`;
