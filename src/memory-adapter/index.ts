/*
 * moleculer-db
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer-db)
 * MIT Licensed
 */

"use strict";

import { cloneDeep, isNumber, isString, pick, values } from "lodash";
import { promisify, resolve } from "bluebird";
import Datastore from "@seald-io/nedb";
import { Service, ServiceBroker } from "moleculer";

/**
 * NeDB adapter for `moleculer-db`
 *
 * @class MemoryDbAdapter
 */
export default class MemoryDbAdapter {
	// Dynamic property key
	[index: string]: any;
	/**
	 * Creates an instance of MemoryDbAdapter.
	 *
	 * @param {Object} opts
	 * @memberof MemoryDbAdapter
	 */
	constructor(opts?: object) {
		this.opts = opts;
	}

	/**
	 * Initialize adapter
	 *
	 * @param {ServiceBroker} broker
	 * @param {Service} service
	 * @memberof MemoryDbAdapter
	 */
	init(broker: ServiceBroker, service: Service) {
		this.broker = broker;
		this.service = service;
	}

	/**
	 * Connect to database
	 *
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	async connect(): Promise<any> {
		// this.db = new Datastore(this.opts); // in-memory
		// if (this.opts instanceof Datastore) {}
		// 	this.db = this.opts; //use preconfigured datastore
		// else this.db = new Datastore(this.opts); // in-memory
		this.db =
			this.opts instanceof Datastore
				? this.opts
				: new Datastore(this.opts);

		[
			"loadDatabase",
			"insert",
			"findOne",
			"count",
			"remove",
			"ensureIndex",
			"removeIndex",
		].forEach((method) => {
			this.db[method] = promisify(this.db[method]);
		});
		["update"].forEach((method) => {
			this.db[method] = promisify(this.db[method], {
				multiArgs: true,
			});
		});

		return await this.db.loadDatabase();
	}

	/**
	 * Disconnect from database
	 *
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	disconnect(): Promise<any> {
		this.db = null;
		return resolve();
	}

	/**
	 * Find all entities by filters.
	 *
	 * Available filter props:
	 * 	- limit
	 *  - offset
	 *  - sort
	 *  - search
	 *  - searchFields
	 *  - query
	 *
	 * @param {Object} filters
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	find(filters?: object): Promise<any> {
		return new Promise((resolve, reject) => {
			this.createCursor(filters!).exec((err: any, docs: any) => {
				/* istanbul ignore next */
				if (err) return reject(err);

				resolve(docs);
			});
		});
	}

	/**
	 * Find an entity by query
	 *
	 * @param {Object} query
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	async findOne(query: object): Promise<any> {
		return await this.db.findOne(query);
	}

	/**
	 * Find an entity by ID
	 *
	 * @param {any} _id
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	async findById(_id: any): Promise<any> {
		return await this.db.findOne({ _id });
	}

	/**
	 * Find all entites by IDs
	 *
	 * @param {Array<Number>} ids
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	findByIds(ids: Array<number>): Promise<any> {
		return new Promise((resolve, reject) => {
			this.db.find({ _id: { $in: ids } }).exec((err: any, docs: any) => {
				/* istanbul ignore next */
				if (err) return reject(err);

				resolve(docs);
			});
		});
	}

	/**
	 * Get count of filtered entites
	 *
	 * Available filter props:
	 *  - search
	 *  - searchFields
	 *  - query
	 *
	 * @param {Object} [filters={}]
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	count(filters: object = {}): Promise<any> {
		return new Promise((resolve, reject) => {
			this.createCursor(filters).exec(
				(err: any, docs: string | any[]) => {
					/* istanbul ignore next */
					if (err) return reject(err);

					resolve(docs.length);
				}
			);
		});
	}

	/**
	 * Insert an entity
	 *
	 * @param {Object} entity
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	async insert(entity: object): Promise<any> {
		return await this.db.insert(entity);
	}

	/**
	 * Insert multiple entities
	 *
	 * @param {Array<Object>} entities
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	async insertMany(entities: Array<object>): Promise<any> {
		return await this.db.insert(entities);
	}

	/**
	 * Update many entities by `query` and `update`
	 *
	 * @param {Object} query
	 * @param {Object} update
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	async updateMany(query: object, update: object): Promise<any> {
		return await this.db
			.update(query, update, { multi: true })
			.then((res: any[]) => res[0]);
	}

	/**
	 * Update an entity by ID
	 *
	 * @param {any} _id
	 * @param {Object} update
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	async updateById(_id: any, update: object): Promise<any> {
		return await this.db
			.update({ _id }, update, { returnUpdatedDocs: true })
			.then((res: any[]) => res[1]);
	}

	/**
	 * Remove many entities which are matched by `query`
	 *
	 * @param {Object} query
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	async removeMany(query: object): Promise<any> {
		return await this.db.remove(query, { multi: true });
	}

	/**
	 * Remove an entity by ID
	 *
	 * @param {any} _id
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	async removeById(_id: any): Promise<any> {
		return await this.db.remove({ _id });
	}

	/**
	 * Clear all entities from DB
	 *
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	async clear(): Promise<any> {
		return await this.db.remove({}, { multi: true });
	}

	/**
	 * Convert DB entity to JSON object
	 *
	 * @param {any} entity
	 * @returns {Object}
	 * @memberof MemoryDbAdapter
	 */
	entityToObject(entity: any): object {
		return entity;
	}

	/**
	 * Add filters to query
	 *
	 * Available filters:
	 *  - search
	 *  - searchFields
	 * 	- sort
	 * 	- limit
	 * 	- offset
	 *  - query
	 *
	 * @param {Object} params
	 * @returns {Query}
	 * @memberof MemoryDbAdapter
	 */
	createCursor(params: Record<string, any>) {
		if (params) {
			let q: {
				sort: (arg0: {}) => void;
				limit: (arg0: number) => void;
				skip: (arg0: number) => void;
			};

			// Text search
			if (isString(params.search) && params.search !== "") {
				let fields: any = [];
				if (params.searchFields) {
					fields = isString(params.searchFields)
						? params.searchFields.split(" ")
						: params.searchFields;
				}

				q = this.db.find({
					$where: function () {
						let item = this;
						if (fields.length > 0) item = pick(this, fields);

						const res = values(item).find(
							(v) =>
								String(v)
									.toLowerCase()
									.indexOf(params.search.toLowerCase()) !== -1
						);

						return res != null;
					},
				});
			} else {
				if (params.query) q = this.db.find(params.query);
				else q = this.db.find({});
			}

			// Sort
			if (params.sort) {
				const sortFields: { [key: string]: number } = {};
				params.sort.forEach((field: string) => {
					if (field.startsWith("-")) sortFields[field.slice(1)] = -1;
					else sortFields[field] = 1;
				});
				q.sort(sortFields);
			}

			// Limit
			if (isNumber(params.limit) && params.limit > 0)
				q.limit(params.limit);

			// Offset
			if (isNumber(params.offset) && params.offset > 0)
				q.skip(params.offset);

			return q;
		}

		return this.db.find({});
	}

	/**
	 * Transforms 'idField' into NeDB's '_id'
	 * @param {Object} entity
	 * @param {String} idField
	 * @memberof MemoryDbAdapter
	 * @returns {Object} Modified entity
	 */
	beforeSaveTransformID(
		entity: Record<string, any>,
		idField: string
	): object {
		let newEntity = cloneDeep(entity);

		if (idField !== "_id" && entity[idField] !== undefined) {
			newEntity._id = newEntity[idField];
			delete newEntity[idField];
		}

		return newEntity;
	}

	/**
	 * Transforms NeDB's '_id' into user defined 'idField'
	 * @param {Object} entity
	 * @param {String} idField
	 * @memberof MemoryDbAdapter
	 * @returns {Object} Modified entity
	 */
	afterRetrieveTransformID(
		entity: Record<string, any>,
		idField: string
	): object {
		if (idField !== "_id") {
			entity[idField] = entity["_id"];
			delete entity._id;
		}
		return entity;
	}
}

module.exports = MemoryDbAdapter;
