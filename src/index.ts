/*
 * moleculer-db-typeorm
 * Copyright (c) 2023 Matthew Marino (https://github.com/Karnith/moleculer-db-typeorm)
 * MIT Licensed
 */

"use strict";

import {
	capitalize,
	cloneDeep,
	compact,
	flattenDeep,
	get,
	isArray,
	isEmpty,
	isFunction,
	isObject,
	isString,
	set,
	uniq,
	unset,
} from "lodash";
import { all, method, reject, resolve } from "bluebird";
import "reflect-metadata";
import { flatten } from "flat";
import { Context, Errors } from "moleculer";
import EntityNotFoundError from "./errors";
import MemoryAdapter from "./memory-adapter";
import TypeORMDbAdapter from "./typeorm-adapter";
import pkg from "../package.json";

/**
 * Service mixin to access database entities
 *
 * @name moleculer-db-typeorm
 * @module Service
 */
module.exports = {
	// Must overwrite it
	name: "",

	// Service's metadata
	metadata: {
		$category: "database",
		$description: "Unofficial Data Access service",
		$official: true,
		$package: {
			name: pkg.name,
			version: pkg.version,
			repo: pkg.repository ? pkg.repository.url : null,
		},
	},

	// Store adapter (NeDB adapter is the default)
	adapter: null,

	mode: "",

	model: "",

	/**
	 * Default settings
	 */
	settings: {
		/** @type {String} Name of ID field. */
		idField: "_id",

		/** @type {Array<String>?} Field filtering list. It must be an `Array`. If the value is `null` or `undefined` doesn't filter the fields of entities. */
		fields: null,

		/** @type {Array<String>?} List of excluded fields. It must be an `Array`. The value is `null` or `undefined` will be ignored. */
		excludeFields: null,

		/** @type {Array?} Schema for population. [Read more](#populating). */
		populates: null,

		/** @type {Number} Default page size in `list` action. */
		pageSize: 10,

		/** @type {Number} Maximum page size in `list` action. */
		maxPageSize: 100,

		/** @type {Number} Maximum value of limit in `find` action. Default: `-1` (no limit) */
		maxLimit: -1,

		/** @type {Object|Function} Validator schema or a function to validate the incoming entity in `create` & 'insert' actions. */
		entityValidator: null,

		/** @type {Boolean} Whether to use dot notation or not when updating an entity. Will **not** convert Array to dot notation. Default: `false` */
		useDotNotation: false,

		/** @type {String} Type of cache clean event type. Values: "broadcast" or "emit" */
		cacheCleanEventType: "broadcast",
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Find entities by query.
		 *
		 * @actions
		 * @cached
		 *
		 * @param {String|Array<String>} populate - Populated fields.
		 * @param {String|Array<String>} fields - Fields filter.
		 * @param {String|Array<String>} excludeFields - List of excluded fields.
		 * @param {Number?} limit - Max count of rows.
		 * @param {Number?} offset - Count of skipped rows.
		 * @param {String?} sort - Sorted fields.
		 * @param {String?} search - Search text.
		 * @param {String|Array<String>} searchFields - Fields for searching.
		 * @param {Object?} query - Query object. Passes to adapter.
		 *
		 * @returns {Array<Object>} List of found entities.
		 */
		find: {
			cache: {
				keys: [
					"populate",
					"fields",
					"excludeFields",
					"limit",
					"offset",
					"sort",
					"search",
					"searchFields",
					"query",
				],
			},
			params: {
				populate: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				fields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				excludeFields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				limit: {
					type: "number",
					integer: true,
					min: 0,
					optional: true,
					convert: true,
				},
				offset: {
					type: "number",
					integer: true,
					min: 0,
					optional: true,
					convert: true,
				},
				sort: { type: "string", optional: true },
				search: { type: "string", optional: true },
				searchFields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				query: [
					{ type: "object", optional: true },
					{ type: "string", optional: true },
				],
			},
			handler(ctx: Context): Array<object> {
				//@ts-ignore
				let params = this.sanitizeParams(ctx, ctx.params);
				//@ts-ignore
				return this._find(ctx, params);
			},
		},

		/**
		 * Get count of entities by query.
		 *
		 * @actions
		 * @cached
		 *
		 * @param {String?} search - Search text.
		 * @param {String|Array<String>} searchFields - Fields list for searching.
		 * @param {Object?} query - Query object. Passes to adapter.
		 *
		 * @returns {Number} Count of found entities.
		 */
		count: {
			cache: {
				keys: ["search", "searchFields", "query"],
			},
			params: {
				search: { type: "string", optional: true },
				searchFields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				query: [
					{ type: "object", optional: true },
					{ type: "string", optional: true },
				],
			},
			handler(ctx: Context): number {
				//@ts-ignore
				let params = this.sanitizeParams(ctx, ctx.params);
				//@ts-ignore
				return this._count(ctx, params);
			},
		},

		/**
		 * List entities by filters and pagination results.
		 *
		 * @actions
		 * @cached
		 *
		 * @param {String|Array<String>} populate - Populated fields.
		 * @param {String|Array<String>} fields - Fields filter.
		 * @param {String|Array<String>} excludeFields - List of excluded fields.
		 * @param {Number?} page - Page number.
		 * @param {Number?} pageSize - Size of a page.
		 * @param {String?} sort - Sorted fields.
		 * @param {String?} search - Search text.
		 * @param {String|Array<String>} searchFields - Fields for searching.
		 * @param {Object?} query - Query object. Passes to adapter.
		 *
		 * @returns {Object} List of found entities and count with pagination info.
		 */
		list: {
			cache: {
				keys: [
					"populate",
					"fields",
					"excludeFields",
					"page",
					"pageSize",
					"sort",
					"search",
					"searchFields",
					"query",
				],
			},
			rest: "GET /",
			params: {
				populate: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				fields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				excludeFields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				page: {
					type: "number",
					integer: true,
					min: 1,
					optional: true,
					convert: true,
				},
				pageSize: {
					type: "number",
					integer: true,
					min: 0,
					optional: true,
					convert: true,
				},
				sort: { type: "string", optional: true },
				search: { type: "string", optional: true },
				searchFields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				query: [
					{ type: "object", optional: true },
					{ type: "string", optional: true },
				],
			},
			handler(ctx: Context): object {
				//@ts-ignore
				let params = this.sanitizeParams(ctx, ctx.params);
				//@ts-ignore
				return this._list(ctx, params);
			},
		},

		/**
		 * Create a new entity.
		 *
		 * @actions
		 *
		 * @param {Object} params - Entity to save.
		 *
		 * @returns {Object} Saved entity.
		 */
		create: {
			rest: "POST /",
			handler(ctx: Context): Object {
				//@ts-ignore
				return this._create(ctx, ctx.params);
			},
		},

		/**
		 * Create many new entities.
		 *
		 * @actions
		 *
		 * @param {Object?} entity - Entity to save.
		 * @param {Array<Object>?} entities - Entities to save.
		 *
		 * @returns {Object|Array<Object>} Saved entity(ies).
		 */
		insert: {
			params: {
				entity: { type: "object", optional: true },
				entities: { type: "array", optional: true },
			},
			handler(ctx: Context): Object | Array<Object> {
				//@ts-ignore
				return this._insert(ctx, ctx.params);
			},
		},

		/**
		 * Get entity by ID.
		 *
		 * @actions
		 * @cached
		 *
		 * @param {any|Array<any>} id - ID(s) of entity.
		 * @param {String|Array<String>} populate - Field list for populate.
		 * @param {String|Array<String>} fields - Fields filter.
		 * @param {String|Array<String>} excludeFields - List of excluded fields.
		 * @param {Boolean?} mapping - Convert the returned `Array` to `Object` where the key is the value of `id`.
		 *
		 * @returns {Object|Array<Object>} Found entity(ies).
		 *
		 * @throws {EntityNotFoundError} - 404 Entity not found
		 */
		get: {
			cache: {
				keys: ["id", "populate", "fields", "excludeFields", "mapping"],
			},
			rest: "GET /:id",
			params: {
				id: [{ type: "string" }, { type: "number" }, { type: "array" }],
				populate: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				fields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				excludeFields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				mapping: { type: "boolean", optional: true },
			},
			handler(ctx: Context): Object | Array<Object> {
				//@ts-ignore
				let params = this.sanitizeParams(ctx, ctx.params);
				//@ts-ignore
				return this._get(ctx, params);
			},
		},

		/**
		 * Update an entity by ID.
		 * > After update, clear the cache & call lifecycle events.
		 *
		 * @actions
		 *
		 * @param {any} id - ID of entity.
		 * @returns {Object} Updated entity.
		 *
		 * @throws {EntityNotFoundError} - 404 Entity not found
		 */
		update: {
			rest: "PUT /:id",
			params: {
				id: { type: "any" },
			},
			handler(ctx: Context): Object {
				//@ts-ignore
				return this._update(ctx, ctx.params);
			},
		},

		/**
		 * Remove an entity by ID.
		 *
		 * @actions
		 *
		 * @param {any} id - ID of entity.
		 * @returns {Number} Count of removed entities.
		 *
		 * @throws {EntityNotFoundError} - 404 Entity not found
		 */
		remove: {
			rest: "DELETE /:id",
			params: {
				id: { type: "any" },
			},
			handler(ctx: Context): number {
				//@ts-ignore
				return this._remove(ctx, ctx.params);
			},
		},
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Connect to database.
		 *
		 * @example
		 * ```js
		 * // use .connect() for standard single connection (mode: 'mt')
		 * // use .connect(mode, options, cb) to create multiple connecitons in multi-tenant mode (mode: 'mt')
		 *
		 * let productsConnection: Connection;
		 * await this.connect('mt', productOpts, (conn: Connection) => {
		 *	return (productsConnection = conn);
		 * });
		 *
		 * console.log(await productsConnection!.getMongoRepository(Products).find());
		 *
		 * ```
		 * @methods
		 *
		 * @param {*} mode
		 * @param {*} options
		 * @param {*} cb
		 *
		 * @returns {Connection} returns connection as callback
		 */
		//@ts-ignore
		connect(mode = this.schema.mode, options: any, cb: any): Promise<any> {
			if (!isEmpty(mode)) {
				//@ts-ignore
				return this.adapter
					.connect(mode, options, cb)
					.then(() => {
						// Call an 'afterConnected' handler in schema
						//@ts-ignore
						if (isFunction(this.schema.afterConnected)) {
							try {
								//@ts-ignore
								return this.schema.afterConnected.call(this);
							} catch (err) {
								/* istanbul ignore next */
								// @ts-ignore
								this.logger.error("afterConnected error!", err);
							}
						}
					})
					.catch((err: any) => {
						/* istanbul ignore next */
						// @ts-ignore
						this.logger.error("TypeORM connect error!", err);
					});
			} else {
				//@ts-ignore
				return this.adapter
					.connect()
					.then(() => {
						// Call an 'afterConnected' handler in schema
						//@ts-ignore
						if (isFunction(this.schema.afterConnected)) {
							try {
								//@ts-ignore
								return this.schema.afterConnected.call(this);
							} catch (err) {
								/* istanbul ignore next */
								// @ts-ignore
								this.logger.error("afterConnected error!", err);
							}
						}
					})
					.catch((err: any) => {
						/* istanbul ignore next */
						// @ts-ignore
						this.logger.error("TypeORM connect error!", err);
					});
			}
		},

		/**
		 * Disconnect from database.
		 */
		disconnect(): any {
			//@ts-ignore
			if (isFunction(this.adapter.disconnect))
				//@ts-ignore
				return this.adapter.disconnect();
		},

		/**
		 * Sanitize context parameters at `find` action.
		 *
		 * @methods
		 *
		 * @param {Context} ctx
		 * @param {Object} params
		 * @returns {Object}
		 */
		sanitizeParams(ctx: Context, params: Record<string, any>): object {
			let p = Object.assign({}, params);

			// Convert from string to number
			if (typeof p.limit === "string") p.limit = Number(p.limit);
			if (typeof p.offset === "string") p.offset = Number(p.offset);
			if (typeof p.page === "string") p.page = Number(p.page);
			if (typeof p.pageSize === "string") p.pageSize = Number(p.pageSize);
			// Convert from string to POJO
			if (typeof p.query === "string") p.query = JSON.parse(p.query);

			if (typeof p.sort === "string") p.sort = p.sort.split(/[,\s]+/);

			if (typeof p.fields === "string")
				p.fields = p.fields.split(/[,\s]+/);

			if (typeof p.excludeFields === "string")
				p.excludeFields = p.excludeFields.split(/[,\s]+/);

			if (typeof p.populate === "string")
				p.populate = p.populate.split(/[,\s]+/);

			if (typeof p.searchFields === "string")
				p.searchFields = p.searchFields.split(/[,\s]+/);

			if (ctx.action!.name!.endsWith(".list")) {
				// Default `pageSize`
				// @ts-ignore
				if (!p.pageSize) p.pageSize = this.settings.pageSize;

				// Default `page`
				if (!p.page) p.page = 1;

				// Limit the `pageSize`
				if (
					// @ts-ignore
					this.settings.maxPageSize > 0 &&
					// @ts-ignore
					p.pageSize > this.settings.maxPageSize
				)
					// @ts-ignore
					p.pageSize = this.settings.maxPageSize;

				// Calculate the limit & offset from page & pageSize
				p.limit = p.pageSize;
				p.offset = (p.page - 1) * p.pageSize;
			}
			// Limit the `limit`
			// @ts-ignore
			if (this.settings.maxLimit > 0 && p.limit > this.settings.maxLimit)
				// @ts-ignore
				p.limit = this.settings.maxLimit;

			return p;
		},

		/**
		 * Get entity(ies) by ID(s).
		 *
		 * @methods
		 * @param {any|Array<any>} id - ID or IDs.
		 * @param {Boolean?} decoding - Need to decode IDs.
		 * @returns {Object|Array<Object>} Found entity(ies).
		 */
		async getById(
			id: any | Array<any>,
			decoding: boolean | null
		): Promise<object | object[]> {
			return await resolve().then(() => {
				if (isArray(id)) {
					// @ts-ignore
					return this.adapter.findByIds(
						decoding ? id.map((id) => this.decodeID(id)) : id
					);
				} else {
					// @ts-ignore
					return this.adapter.findById(
						decoding ? this.decodeID(id) : id
					);
				}
			});
		},

		/**
		 * Call before entity lifecycle events
		 *
		 * @methods
		 * @param {String} type
		 * @param {Object} entity
		 * @param {Context} ctx
		 * @returns {Promise}
		 */
		beforeEntityChange(
			type: string,
			entity: object,
			ctx: Context
		): Promise<any> {
			const eventName = `beforeEntity${capitalize(type)}`;
			// @ts-ignore
			if (this.schema[eventName] == null) {
				return resolve(entity);
			}
			return resolve(
				// @ts-ignore
				this.schema[eventName].call(this, entity, ctx)
			);
		},

		/**
		 * Clear the cache & call entity lifecycle events
		 *
		 * @methods
		 * @param {String} type
		 * @param {Object|Array<Object>|Number} json
		 * @param {Context} ctx
		 * @returns {Promise}
		 */
		entityChanged(
			type: string,
			json: object | Array<object> | number,
			ctx: Context
		): Promise<any> {
			return this.clearCache().then(() => {
				const eventName = `entity${capitalize(type)}`;
				// @ts-ignore
				if (this.schema[eventName] != null) {
					// @ts-ignore
					return this.schema[eventName].call(this, json, ctx);
				}
			});
		},

		/**
		 * Clear cached entities
		 *
		 * @methods
		 * @returns {Promise}
		 */
		clearCache(): Promise<any> {
			// @ts-ignore
			this.broker[this.settings.cacheCleanEventType](
				// @ts-ignore
				`cache.clean.${this.fullName}`
			);
			// @ts-ignore
			if (this.broker.cacher)
				// @ts-ignore
				return this.broker.cacher.clean(`${this.fullName}.**`);
			return resolve();
		},

		/**
		 * Transform the fetched documents
		 * @methods
		 * @param {Context} ctx
		 * @param {Object} 	params
		 * @param {Array|Object} docs
		 * @returns {Array|Object}
		 */
		transformDocuments(
			ctx: Context,
			params: Record<string, any>,
			docs: Array<any> | object
		): Promise<Array<any> | object> {
			let isDoc = false;
			if (!Array.isArray(docs)) {
				if (isObject(docs)) {
					isDoc = true;
					docs = [docs];
				} else return resolve(docs);
			}

			return (
				resolve(docs)
					// Convert entity to JS object
					.then((docs) =>
						// @ts-ignore
						docs.map((doc) => this.adapter.entityToObject(doc))
					)

					// Apply idField
					.then((docs) =>
						docs.map((doc: any) =>
							// @ts-ignore
							this.adapter.afterRetrieveTransformID(
								doc,
								// @ts-ignore
								this.settings.idField
							)
						)
					)
					// Encode IDs
					.then((docs) =>
						docs.map((doc: { [x: string]: any }) => {
							// @ts-ignore
							doc[this.settings.idField] = this.encodeID(
								// @ts-ignore
								doc[this.settings.idField]
							);
							return doc;
						})
					)
					// Populate
					.then((json) =>
						ctx && params.populate
							? this.populateDocs(ctx, json, params.populate)
							: json
					)

					// TODO onTransformHook

					// Filter fields
					.then((json) => {
						if (ctx && params.fields) {
							const fields = isString(params.fields)
								? // Compatibility with < 0.4
								  /* istanbul ignore next */
								  params.fields.split(/\s+/)
								: params.fields;
							// Authorize the requested fields
							const authFields = this.authorizeFields(fields);

							return json.map((item: any) =>
								this.filterFields(item, authFields)
							);
						} else {
							return json.map((item: any) =>
								// @ts-ignore
								this.filterFields(item, this.settings.fields)
							);
						}
					})

					// Filter excludeFields
					.then((json) => {
						const askedExcludeFields =
							ctx && params.excludeFields
								? isString(params.excludeFields)
									? params.excludeFields.split(/\s+/)
									: params.excludeFields
								: [];
						const excludeFields = askedExcludeFields.concat(
							// @ts-ignore
							this.settings.excludeFields || []
						);

						if (
							Array.isArray(excludeFields) &&
							excludeFields.length > 0
						) {
							return json.map((doc: any) => {
								return this._excludeFields(doc, excludeFields);
							});
						} else {
							return json;
						}
					})

					// Return
					.then((json) => (isDoc ? json[0] : json))
			);
		},

		/**
		 * Filter fields in the entity object
		 *
		 * @param {Object} 	doc
		 * @param {Array<String>} 	fields	Filter properties of model.
		 * @returns	{Object}
		 */
		filterFields(doc: object, fields: Array<string>): object {
			// Apply field filter (support nested paths)
			if (Array.isArray(fields)) {
				let res = {};
				fields.forEach((n) => {
					const v = get(doc, n);
					if (v !== undefined) set(res, n, v);
				});
				return res;
			}

			return doc;
		},

		/**
		 * Exclude fields in the entity object
		 *
		 * @param {Object} 	doc
		 * @param {Array<String>} 	fields	Exclude properties of model.
		 * @returns	{Object}
		 */
		excludeFields(doc: object, fields: Array<string>): object {
			if (Array.isArray(fields) && fields.length > 0) {
				return this._excludeFields(doc, fields);
			}

			return doc;
		},

		/**
		 * Exclude fields in the entity object. Internal use only, must ensure `fields` is an Array
		 */
		_excludeFields(doc: any, fields: any[]) {
			const res = cloneDeep(doc);
			fields.forEach((field) => {
				unset(res, field);
			});
			return res;
		},

		/**
		 * Authorize the required field list. Remove fields which is not exist in the `this.settings.fields`
		 *
		 * @param {Array} askedFields
		 * @returns {Array}
		 */
		authorizeFields(askedFields: Array<any>): Array<any> {
			// @ts-ignore
			if (this.settings.fields && this.settings.fields.length > 0) {
				let allowedFields: Array<any> = [];
				if (Array.isArray(askedFields) && askedFields.length > 0) {
					askedFields.forEach((askedField) => {
						// @ts-ignore
						if (this.settings.fields.indexOf(askedField) !== -1) {
							allowedFields.push(askedField);
							return;
						}

						if (askedField.indexOf(".") !== -1) {
							let parts = askedField.split(".");
							while (parts.length > 1) {
								parts.pop();
								if (
									// @ts-ignore
									this.settings.fields.indexOf(
										parts.join(".")
									) !== -1
								) {
									allowedFields.push(askedField);
									return;
								}
							}
						}

						// @ts-ignore
						let nestedFields = this.settings.fields.filter(
							(settingField: string) =>
								settingField.startsWith(askedField + ".")
						);
						if (nestedFields.length > 0) {
							allowedFields = allowedFields.concat(nestedFields);
						}
					});
					//return _.intersection(f, this.settings.fields);
				}
				return allowedFields;
			}

			return askedFields;
		},

		/**
		 * Populate documents.
		 *
		 * @param {Context} 		ctx
		 * @param {Array|Object} 	docs
		 * @param {Array?}			populateFields
		 * @returns	{Promise}
		 */
		populateDocs(
			ctx: Context,
			docs: Array<any> | object,
			populateFields: Array<any> | null
		): Promise<any> {
			if (
				// @ts-ignore
				!this.settings.populates ||
				!Array.isArray(populateFields) ||
				populateFields.length == 0
			)
				return resolve(docs);

			if (docs == null || (!isObject(docs) && !Array.isArray(docs)))
				return resolve(docs);
			// @ts-ignore
			const settingPopulateFields = Object.keys(this.settings.populates);

			/* Group populateFields by populatesFields for deep population.
			(e.g. if "post" in populates and populateFields = ["post.author", "post.reviewer", "otherField"])
			then they would be grouped together: { post: ["post.author", "post.reviewer"], otherField:["otherField"]}
			*/
			const groupedPopulateFields = populateFields.reduce(
				(obj, populateField) => {
					const settingPopulateField = settingPopulateFields.find(
						(settingPopulateField) =>
							settingPopulateField === populateField ||
							populateField.startsWith(settingPopulateField + ".")
					);
					if (settingPopulateField != null) {
						if (obj[settingPopulateField] == null) {
							obj[settingPopulateField] = [populateField];
						} else {
							obj[settingPopulateField].push(populateField);
						}
					}
					return obj;
				},
				{}
			);

			let promises: Array<any> = [];
			for (const populatesField of settingPopulateFields) {
				// @ts-ignore
				let rule = this.settings.populates[populatesField];
				if (groupedPopulateFields[populatesField] == null) continue; // skip

				// if the rule is a function, save as a custom handler
				if (isFunction(rule)) {
					rule = {
						handler: method(rule),
					};
				}

				// If the rule is string, convert to object
				if (isString(rule)) {
					rule = {
						action: rule,
					};
				}

				if (rule.field === undefined) rule.field = populatesField;

				let arr = Array.isArray(docs) ? docs : [docs];

				// Collect IDs from field of docs (flatten, compact & unique list)
				let idList = uniq(
					flattenDeep(compact(arr.map((doc) => get(doc, rule.field))))
				);
				// Replace the received models according to IDs in the original docs
				const resultTransform = (populatedDocs: any) => {
					arr.forEach((doc) => {
						let id = get(doc, rule.field);
						if (isArray(id)) {
							let models = compact(
								id.map((id) => populatedDocs[id])
							);
							set(doc, populatesField, models);
						} else {
							set(doc, populatesField, populatedDocs[id]);
						}
					});
				};

				if (rule.handler) {
					promises.push(
						rule.handler.call(this, idList, arr, rule, ctx)
					);
				} else if (idList.length > 0) {
					// Call the target action & collect the promises
					const params = Object.assign(
						{
							id: idList,
							mapping: true,
							populate: [
								// Transform "post.author" into "author" to pass to next populating service
								...groupedPopulateFields[populatesField]
									.map((populateField: string | any[]) =>
										populateField.slice(
											populatesField.length + 1
										)
									) //+1 to also remove any leading "."
									.filter((field: string) => field !== ""),
								...(rule.populate ? rule.populate : []),
							],
						},
						rule.params || {}
					);

					if (params.populate.length === 0) {
						delete params.populate;
					}

					promises.push(
						ctx.call(rule.action, params).then(resultTransform)
					);
				}
			}

			return all(promises).then(() => docs);
		},

		/**
		 * Validate an entity by validator.
		 * @methods
		 * @param {Object} entity
		 * @returns {Promise}
		 */
		validateEntity(entity: object): Promise<any> {
			// @ts-ignore
			if (!isFunction(this.settings.entityValidator))
				return resolve(entity);

			let entities = Array.isArray(entity) ? entity : [entity];
			return all(
				entities.map((entity) =>
					// @ts-ignore
					this.settings.entityValidator.call(this, entity)
				)
			).then(() => entity);
		},

		/**
		 * Encode ID of entity.
		 *
		 * @methods
		 * @param {any} id
		 * @returns {any}
		 */
		encodeID(id: any): any {
			return id;
		},

		/**
		 * Decode ID of entity.
		 *
		 * @methods
		 * @param {any} id
		 * @returns {any}
		 */
		decodeID(id: any): any {
			return id;
		},

		/**
		 * Find entities by query.
		 *
		 * @methods
		 *
		 * @param {Context} ctx - Context instance.
		 * @param {Object?} params - Parameters.
		 *
		 * @returns {Array<Object>} List of found entities.
		 */
		_find(ctx: Context, params: Record<string, any>): Array<object> {
			// @ts-ignore
			return this.adapter
				.find(params)
				.then((docs: any) =>
					this.transformDocuments(ctx, params, docs)
				);
		},

		/**
		 * Get count of entities by query.
		 *
		 * @methods
		 *
		 * @param {Context} ctx - Context instance.
		 * @param {Object?} params - Parameters.
		 *
		 * @returns {Number} Count of found entities.
		 */
		_count(ctx: Context, params: Record<string, unknown> | null): number {
			// Remove pagination params
			if (params && params.limit) params.limit = null;
			if (params && params.offset) params.offset = null;
			// @ts-ignore
			return this.adapter.count(params);
		},

		/**
		 * List entities by filters and pagination results.
		 *
		 * @methods
		 *
		 * @param {Context} ctx - Context instance.
		 * @param {Object?} params - Parameters.
		 *
		 * @returns {Object} List of found entities and count.
		 */
		_list(ctx: Context, params: Record<string, any>): object {
			let countParams = Object.assign({}, params);
			// Remove pagination params
			if (countParams && countParams.limit) countParams.limit = null;
			if (countParams && countParams.offset) countParams.offset = null;
			if (params.limit == null) {
				if (
					// @ts-ignore
					this.settings.limit > 0 &&
					// @ts-ignore
					params.pageSize > this.settings.limit
				)
					// @ts-ignore
					params.limit = this.settings.limit;
				else params.limit = params.pageSize;
			}
			return all([
				// Get rows
				// @ts-ignore
				this.adapter.find(params),
				// Get count of all rows
				// @ts-ignore
				this.adapter.count(countParams),
			]).then((res) => {
				return this.transformDocuments(ctx, params, res[0]).then(
					(docs: any) => {
						return {
							// Rows
							rows: docs,
							// Total rows
							total: res[1],
							// Page
							page: params.page,
							// Page size
							pageSize: params.pageSize,
							// Total pages
							totalPages: Math.floor(
								(res[1] + params.pageSize - 1) / params.pageSize
							),
						};
					}
				);
			});
		},

		/**
		 * Create a new entity.
		 *
		 * @methods
		 *
		 * @param {Context} ctx - Context instance.
		 * @param {Object?} params - Parameters.
		 *
		 * @returns {Object} Saved entity.
		 */
		_create(ctx: Context, params: object): object {
			let entity = params;
			return (
				this.beforeEntityChange("create", entity, ctx)
					.then((entity: any) => this.validateEntity(entity))
					// Apply idField
					.then((entity: any) =>
						// @ts-ignore
						this.adapter.beforeSaveTransformID(
							entity,
							// @ts-ignore
							this.settings.idField
						)
					)
					// @ts-ignore
					.then((entity: any) => this.adapter.insert(entity))
					.then((doc: any) => this.transformDocuments(ctx, {}, doc))
					.then((json: any) =>
						this.entityChanged("created", json, ctx).then(
							() => json
						)
					)
			);
		},

		/**
		 * Create many new entities.
		 *
		 * @methods
		 *
		 * @param {Context} ctx - Context instance.
		 * @param {Object?} params - Parameters.
		 *
		 * @returns {Object|Array.<Object>} Saved entity(ies).
		 */
		_insert(
			ctx: Context,
			params: Record<string, unknown>
		): object | Array<object> {
			return resolve()
				.then(() => {
					if (Array.isArray(params.entities)) {
						return (
							all(
								params.entities.map((entity) =>
									this.beforeEntityChange(
										"create",
										entity,
										ctx
									)
								)
							)
								.then((entities) =>
									this.validateEntity(entities)
								)
								.then((entities) =>
									all(
										entities.map((entity: any) =>
											this.beforeEntityChange(
												"create",
												entity,
												ctx
											)
										)
									)
								)
								// Apply idField
								.then((entities) => {
									// @ts-ignore
									if (this.settings.idField === "_id")
										return entities;
									return entities.map((entity) =>
										// @ts-ignore
										this.adapter.beforeSaveTransformID(
											entity,
											// @ts-ignore
											this.settings.idField
										)
									);
								})
								.then((entities) =>
									// @ts-ignore
									this.adapter.insertMany(entities)
								)
						);
					} else if (params.entity) {
						return (
							this.beforeEntityChange(
								"create",
								params.entity,
								ctx
							)
								.then((entity: any) =>
									this.validateEntity(entity)
								)
								// Apply idField
								.then((entity: any) =>
									// @ts-ignore
									this.adapter.beforeSaveTransformID(
										entity,
										// @ts-ignore
										this.settings.idField
									)
								)
								.then((entity: any) =>
									// @ts-ignore
									this.adapter.insert(entity)
								)
						);
					}
					return reject(
						new Errors.MoleculerClientError(
							"Invalid request! The 'params' must contain 'entity' or 'entities'!",
							400
						)
					);
				})
				.then((docs) => this.transformDocuments(ctx, {}, docs))
				.then((json) =>
					this.entityChanged("created", json, ctx).then(() => json)
				);
		},

		/**
		 * Get entity by ID.
		 *
		 * @methods
		 *
		 * @param {Context} ctx - Context instance.
		 * @param {Object?} params - Parameters.
		 *
		 * @returns {Object|Array<Object>} Found entity(ies).
		 *
		 * @throws {EntityNotFoundError} - 404 Entity not found
		 */
		_get(
			ctx: Context,
			params: Record<string, unknown>
		): object | Array<object> {
			let id = params.id;
			let origDoc: any;
			let shouldMapping = params.mapping === true;
			return this.getById(id, true)
				.then((doc) => {
					if (!doc) return reject(new EntityNotFoundError(id));

					if (shouldMapping)
						origDoc = isArray(doc)
							? doc.map((d) => cloneDeep(d))
							: cloneDeep(doc);
					else origDoc = doc;

					return this.transformDocuments(ctx, params, doc);
				})
				.then((json) => {
					if (params.mapping !== true) return json;

					let res: { [x: string]: any } = {};
					if (isArray(json)) {
						json.forEach((doc, i) => {
							const id = this.encodeID(
								// @ts-ignore
								this.adapter.afterRetrieveTransformID(
									origDoc[i],
									// @ts-ignore
									this.settings.idField
									// @ts-ignore
								)[this.settings.idField]
							);
							res[id] = doc;
						});
					} else if (isObject(json)) {
						const id = this.encodeID(
							// @ts-ignore
							this.adapter.afterRetrieveTransformID(
								origDoc,
								// @ts-ignore
								this.settings.idField
								// @ts-ignore
							)[this.settings.idField]
						);
						res[id] = json;
					}
					return res;
				});
		},

		/**
		 * Update an entity by ID.
		 * > After update, clear the cache & call lifecycle events.
		 *
		 * @methods
		 *
		 * @param {Context} ctx - Context instance.
		 * @param {Object?} params - Parameters.
		 * @param {Object?} options - Options to send.
		 * @returns {Object} Updated entity.
		 *
		 * @throws {EntityNotFoundError} - 404 Entity not found
		 */
		_update(ctx: Context, params: object): object {
			let id: any;

			return (
				resolve()
					.then(() => this.beforeEntityChange("update", params, ctx))
					.then((params) => {
						let sets: { [x: string]: any } = {};
						// Convert fields from params to "$set" update object
						Object.keys(params).forEach((prop) => {
							// @ts-ignore
							if (prop == "id" || prop == this.settings.idField)
								id = this.decodeID(params[prop]);
							else sets[prop] = params[prop];
						});
						// @ts-ignore
						if (this.settings.useDotNotation)
							sets = flatten(sets, { safe: true });

						return sets;
					})
					// @ts-ignore
					.then((sets) => this.adapter.updateById(id, { $set: sets }))
					.then((doc) => {
						if (!doc) return reject(new EntityNotFoundError(id));
						return this.transformDocuments(ctx, {}, doc).then(
							(json) =>
								this.entityChanged("updated", json, ctx).then(
									() => json
								)
						);
					})
			);
		},

		/**
		 * Remove an entity by ID.
		 *
		 * @methods
		 *
		 * @param {Context} ctx - Context instance.
		 * @param {Object?} params - Parameters.
		 *
		 * @throws {EntityNotFoundError} - 404 Entity not found
		 */
		_remove(ctx: Context, params: Record<string, unknown>): any {
			const id = this.decodeID(params.id);
			return (
				resolve()
					.then(() => this.beforeEntityChange("remove", params, ctx))
					// @ts-ignore
					.then(() => this.adapter.removeById(id))
					.then((doc) => {
						if (!doc)
							return reject(new EntityNotFoundError(params.id));
						return this.transformDocuments(ctx, {}, doc).then(
							(json) =>
								this.entityChanged("removed", json, ctx).then(
									() => json
								)
						);
					})
			);
		},
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		// Compatibility with < 0.4
		if (isString(this.settings.fields)) {
			this.settings.fields = this.settings.fields.split(/\s+/);
		}

		if (isString(this.settings.excludeFields)) {
			this.settings.excludeFields =
				this.settings.excludeFields.split(/\s+/);
		}

		if (!this.schema.adapter) this.adapter = new MemoryAdapter();
		else this.adapter = this.schema.adapter;

		switch (this.schema.mode.toLowerCase()) {
			case "mt":
				this.adapter.init(this.broker, this);
				this.logger.warn(
					`Database ${this.name} connection set to multi-tenant. Use this.connect() to connect to TypeORM connecion and this.disconnect() to close it.`
				);
				break;
			case "standard":
				this.adapter.init(this.broker, this);
				this.logger.warn(
					`Database ${this.name} connection set to standard. Use this.adapter to interact with the database.`
				);
				break;
			default:
				this.adapter.init(this.broker, this);
				this.logger.warn(
					`Database ${this.name} connection set to default. Use this.adapter to interact with the database.`
				);
				break;
		}

		// Transform entity validation schema to checker function
		if (
			this.broker.validator &&
			isObject(this.settings.entityValidator) &&
			!isFunction(this.settings.entityValidator)
		) {
			const check = this.broker.validator.compile(
				this.settings.entityValidator
			);
			this.settings.entityValidator = async (entity: any) => {
				let res = check(entity);
				if (check.async === true || res.then instanceof Function)
					res = await res;
				if (res === true) return resolve();
				else
					return reject(
						new Errors.ValidationError(
							"Entity validation error!",
							"",
							res
						)
					);
			};
		}
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		if (!this.schema.mode || this.schema.mode.toLowerCase() == "standard") {
			if (this.adapter) {
				return new Promise((resolve) => {
					let connecting = () => {
						this.connect()
							.then(resolve)
							.catch((err: any) => {
								this.logger.error("Connection error!", err);
								setTimeout(() => {
									this.logger.warn("Reconnecting...");
									connecting();
								}, 1000);
							});
					};

					connecting();
				});
			}
			/* istanbul ignore next */
			return reject(
				new Error("Please set the store adapter in schema on!")
			);
		}
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
		if (this.adapter) return this.disconnect();
	},

	// Export Memory Adapter class
	MemoryAdapter,
	TypeORMDbAdapter,
};
