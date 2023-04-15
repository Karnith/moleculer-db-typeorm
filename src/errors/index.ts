/*
 * moleculer-db
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer-db)
 * MIT Licensed
 */

"use strict";

import { Errors } from "moleculer";

//const ERR_ENTITY_NOT_FOUND = "ERR_ENTITY_NOT_FOUND";

/**
 * Entity not found
 *
 * @class EntityNotFoundError
 * @extends {MoleculerClientError}
 */
export default class EntityNotFoundError extends Errors.MoleculerClientError {
	/**
	 * Creates an instance of EntityNotFoundError.
	 *
	 * @param {any} ID of entity
	 *
	 * @memberOf EntityNotFoundError
	 */
	constructor(id: unknown) {
		super("Entity not found", 404, "", {
			id,
		});
	}
}
