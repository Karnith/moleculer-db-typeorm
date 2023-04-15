"use strict";

// let errors = require("../../src/errors");
import EntityNotFoundError from "../../src/errors";

describe("Test Errors", () => {
	it("test EntityNotFoundError", () => {
		let err = new EntityNotFoundError(123);
		expect(err).toBeDefined();
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(EntityNotFoundError);
		expect(err.code).toBe(404);
		expect(err.type).toBe("");
		expect(err.name).toBe("EntityNotFoundError");
		expect(err.message).toBe("Entity not found");
		expect(err.data).toEqual({
			id: 123,
		});
	});
});
