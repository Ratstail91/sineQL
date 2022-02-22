const sineQL = require('../source');

const schema = `

scalar Date

type Book {
	unique String title
	Date published
	Float rating
}

type Author {
	unique String name
	Book books
}

`;

const dummyHandlers = {
	Book: async (tree, typeGraph) => tree,
	Author: async (tree, typeGraph) => tree,
};

const handlerPackage = {
	queryHandlers: dummyHandlers,
	createHandlers: dummyHandlers,
	updateHandlers: dummyHandlers,
	deleteHandlers: dummyHandlers,
};

test('sinQL - Testing creation and function of the sine function', async () => {
	//setup
	const sine = sineQL(schema, handlerPackage);

	//process
	const a = await sine('Book { title }');
	const b = await sine('create Book { create title "The Wind in the Willows" }');
	const c = await sine('update Book { match title "The Wind in the Willows" update published "1908-04-01" }');
	const d = await sine('delete Book { match title "The Wind in the Willows" }');

	//inspect
	expect(a[0]).toEqual(200);
	expect(b[0]).toEqual(200);
	expect(c[0]).toEqual(200);
	expect(d[0]).toEqual(200);
});

test('sinQL - Testing error handling (lack of handlers)', async () => {
	//setup
	const sine = sineQL(schema, {});

	//process
	const a = await sine('Book { title }');
	const b = await sine('create Book { create title "The Wind in the Willows" }');
	const c = await sine('update Book { match title "The Wind in the Willows" update published "1908-04-01" }');
	const d = await sine('delete Book { match title "The Wind in the Willows" }');

	//inspect
	expect(a[0]).toEqual(405);
	expect(b[0]).toEqual(405);
	expect(c[0]).toEqual(405);
	expect(d[0]).toEqual(405);
});
