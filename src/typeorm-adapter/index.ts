/*
 * moleculer-db
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer-db)
 * MIT Licensed
 */

"use strict";
import "reflect-metadata";
import { cloneDeep, isArray } from "lodash";
import { /* promisify, */ resolve } from "bluebird";
import { Service, ServiceBroker, Errors } from "moleculer";
import {
	// BaseEntity,
	DataSource,
	DataSourceOptions,
	DeepPartial,
	DeleteOptions,
	DeleteResult,
	// EntityManager,
	EntitySchema,
	EntityTarget,
	FindManyOptions,
	FindOneOptions,
	FindOptionsWhere,
	InsertResult,
	ObjectId,
	// MongoEntityManager,
	// MongoRepository,
	ObjectLiteral,
	RemoveOptions,
	Repository,
	SaveOptions,
	SelectQueryBuilder,
	UpdateResult,
} from "typeorm";
import ConnectionManager from "./connectionManager";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { PickKeysByType } from "typeorm/common/PickKeysByType";
import { UpsertOptions } from "typeorm/repository/UpsertOptions";

/**
 * Mongo TypeORM Adapter
 *
 * @name moleculer-db-typeORM
 * @module Service
 * @class TypeOrmDbAdapter
 */
export default class TypeORMDbAdapter<Entity extends ObjectLiteral> {
	// Dynamic property key
	[index: string]: any;
	connectionManager: ConnectionManager | undefined;
	_entity: EntitySchema<Entity> | undefined;
	dataSource: DataSource | undefined;

	/**
	 * Creates an instance of MemoryDbAdapter.
	 *
	 * @param {Object} opts
	 * @memberof TypeOrmDbAdapter
	 */
	constructor(opts?: DataSourceOptions) {
		this.opts = opts;
	}

	/**
	 * Initialize adapter
	 *
	 * @param {ServiceBroker} broker
	 * @param {Service} service
	 * @memberof TypeOrmDbAdapter
	 */
	init(broker: ServiceBroker, service: Service) {
		this.broker = broker;
		this.service = service;
		const entityFromService = this.service.schema.model;
		const isValid = !!entityFromService.constructor;
		if (!isValid) {
			new Errors.MoleculerServerError(
				"Invalid model. It should be a typeorm repository"
			);
		}
		this._entity = entityFromService;
	}

	/**
	 * Connect to database
	 *
	 * @returns {Promise}
	 * @memberof TypeORMDbAdapter
	 */
	async connect(): Promise<any> {
		/* this.db =
			this.opts instanceof DataSource
				? this.opts
				: new DataSource(this.opts); */
		this.connectionManager = new ConnectionManager();
		this.db = await this.connectionManager.create(this.opts);
		/* [
			"options",
			"isInitialized",
			"driver",
			"manager",
			"mongoManager",
			"initialize",
			"destroy",
			"synchronize",
			"dropDatabase",
			"runMigrations",
			"undoLastMigration",
			"hasMetadata",
			"getMetadata",
			"getRepository",
			"getTreeRepository",
			"getMongoRepository",
			"transaction",
			"query",
			"createQueryBuilder",
			"createQueryRunner",
		].forEach((method) => {
			this.db[method] = promisify(this.db[method]);
		}); */
		/* ["connectionManager"].forEach((method) => {
			this.db[method] = this.connectionManager;
		}); */
		/* ["update"].forEach((method) => {
			this.db[method] = Promise.promisify(this.db[method], {
				multiArgs: true,
			});
		}); */

		return await this.db.initialize().then((datasource: any) => {
			this.broker.logger.info(
				`${this.service.name} has connected to ${datasource.name} database`
			);
			/* const entity: { [key: string]: any } = this
				._entity as unknown as DataSource;
			[
				"save",
				// "isInitialized",
				// "driver",
				// "manager",
				// "mongoManager",
				// "initialize",
				// "destroy",
				// "synchronize",
				// "dropDatabase",
				// "runMigrations",
				// "undoLastMigration",
				// "hasMetadata",
				// "getMetadata",
				// "getRepository",
				// "getTreeRepository",
				// "getMongoRepository",
				// "transaction",
				// "query",
				// "createQueryBuilder",
				// "createQueryRunner",
			].forEach((method) => {
				this[method] = entity[method]();
			}); */
			this.dataSource = datasource;
			return datasource;
		});
	}

	/**
	 * Disconnect from database
	 *
	 * @returns {Promise}
	 * @memberof MemoryDbAdapter
	 */
	async disconnect(): Promise<any> {
		this.broker.logger.info(
			`Attempting to disconnect from database ${this.dataSource!.name}...`
		);
		this.connectionManager!.has(this.dataSource!.name || "default")
			? await this.connectionManager!.close(
					this.dataSource!.name || "default"
			  ).then((disconnected) => {
					isArray(disconnected)
						? disconnected.forEach(async (connection) => {
								(await connection)
									? this.broker.logger.info(
											`Disconnected from database ${
												this.dataSource!.name
											}`
									  )
									: this.broker.logger.info(
											`Failed to disconnect from database ${
												this.dataSource!.name
											}`
									  );
						  })
						: disconnected
						? this.broker.logger.info(
								`Disconnected from database ${
									this.dataSource!.name
								}`
						  )
						: this.broker.logger.info(
								`Failed to disconnect from database ${
									this.dataSource!.name
								}`
						  );
			  })
			: new Errors.MoleculerServerError(
					`Connection ${this.dataSource!.name} does not exist`
			  );
		// this.db = null;
		return resolve();
	}

	/**
	 * DataSource used in all static methods of the BaseEntity.
	 */
	// private static dataSource: DataSource | null

	// -------------------------------------------------------------------------
	// Public Methods
	// -------------------------------------------------------------------------

	/**
	 * Checks if entity has an id.
	 * If entity composite compose ids, it will check them all.
	 */
	async hasId(): Promise<boolean> {
		// const baseEntity = this.db;
		// const baseEntity = this.constructor as typeof this.db;
		const baseEntity: any = this._entity!;
		return await baseEntity.hasId(this);
	}

	/**
	 * Saves current entity in the database.
	 * If entity does not exist in the database then inserts, otherwise updates.
	 */
	async save(options?: SaveOptions): Promise<this> {
		// const baseEntity = this.db;
		// const baseEntity = this.constructor as typeof this.db;
		const baseEntity: any = this._entity!;
		return await baseEntity.save(options);
		// return baseEntity.getRepository().save(this, options);
	}

	/**
	 * Removes current entity from the database.
	 */
	async remove(options?: RemoveOptions): Promise<this> {
		// const baseEntity = this.db;
		// const baseEntity = this.constructor as typeof this.db;
		const baseEntity: any = this._entity!;
		return await baseEntity.remove(options);
	}

	/**
	 * delete entity from the database by id.
	 */
	async delete(options?: DeleteOptions): Promise<this> {
		// const baseEntity = this.db;
		// const baseEntity = this.constructor as typeof this.db;
		const baseEntity: any = this._entity!;
		return await baseEntity.delete(options);
	}

	/**
	 * Records the delete date of current entity.
	 */
	async softRemove(options?: SaveOptions): Promise<this> {
		// const baseEntity = this.db;
		// const baseEntity = this.constructor as typeof this.db;
		const baseEntity: any = this._entity!;
		return await baseEntity.softRemove(options);
	}

	/**
	 * Recovers a given entity in the database.
	 */
	async recover(options?: SaveOptions): Promise<this> {
		// const baseEntity = this.db;
		// const baseEntity = this.constructor as typeof this.db;
		const baseEntity: any = this._entity!;
		return await baseEntity.recover(options);
	}

	/**
	 * Reloads entity data from the database.
	 */
	async reload(): Promise<void> {
		// const baseEntity = this.db;
		// const baseEntity = this.constructor as typeof this.db;
		const baseEntity: any = this._entity!;
		return await baseEntity.reload();
	}

	// -------------------------------------------------------------------------
	// Public Static Methods
	// -------------------------------------------------------------------------

	/**
	 * Sets DataSource to be used by entity.
	 */
	useDataSource(dataSource: DataSource | undefined) {
		this.dataSource = dataSource;
	}

	/**
	 * Gets current entity's Repository.
	 */
	static getRepository<T extends ObjectLiteral>(this: T): Repository<T> {
		// const dataSource = this.db;
		const dataSource = (this as typeof this.db).dataSource;
		if (!dataSource)
			throw new Error(`DataSource is not set for this entity.`);
		return dataSource.getRepository(this);
	}

	/**
	 * Returns object that is managed by this repository.
	 * If this repository manages entity from schema,
	 * then it returns a name of that schema instead.
	 */
	get target(): EntityTarget<any> {
		return this.getRepository().target;
	}

	/**
	 * Checks entity has an id.
	 * If entity composite compose ids, it will check them all.
	 */
	static hasId(entity: any): boolean {
		return this.getRepository().hasId(entity);
	}

	/**
	 * Gets entity mixed id.
	 */
	static getId<T extends ObjectLiteral>(this: T, entity: T): any {
		return this.getRepository().getId(entity);
	}

	/**
	 * Creates a new query builder that can be used to build a SQL query.
	 */
	static createQueryBuilder<T extends ObjectLiteral>(
		this: T,
		alias?: string
	): SelectQueryBuilder<T> {
		return this.getRepository().createQueryBuilder(alias);
	}

	/**
	 * Creates a new entity instance.
	 */
	static create<T extends ObjectLiteral>(this: T): T;

	/**
	 * Creates a new entities and copies all entity properties from given objects into their new entities.
	 * Note that it copies only properties that present in entity schema.
	 */
	static create<T extends ObjectLiteral>(
		this: T,
		entityLikeArray: DeepPartial<T>[]
	): T[];

	/**
	 * Creates a new entity instance and copies all entity properties from this object into a new entity.
	 * Note that it copies only properties that present in entity schema.
	 */
	static create<T extends ObjectLiteral>(
		this: T,
		entityLike: DeepPartial<T>
	): T;

	/**
	 * Creates a new entity instance and copies all entity properties from this object into a new entity.
	 * Note that it copies only properties that present in entity schema.
	 */
	static create<T extends ObjectLiteral>(this: T, entityOrEntities?: any) {
		return this.getRepository().create(entityOrEntities);
	}

	/**
	 * Merges multiple entities (or entity-like objects) into a given entity.
	 */
	static merge<T extends ObjectLiteral>(
		this: T,
		mergeIntoEntity: T,
		...entityLikes: DeepPartial<T>[]
	): T {
		return this.getRepository().merge(mergeIntoEntity, ...entityLikes) as T;
	}

	/**
	 * Creates a new entity from the given plain javascript object. If entity already exist in the database, then
	 * it loads it (and everything related to it), replaces all values with the new ones from the given object
	 * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
	 * replaced from the new object.
	 *
	 * Note that given entity-like object must have an entity id / primary key to find entity by.
	 * Returns undefined if entity with given id was not found.
	 */
	static preload<T extends ObjectLiteral>(
		this: T,
		entityLike: DeepPartial<T>
	): Promise<T | undefined> {
		const thisRepository = this.getRepository();
		return thisRepository.preload(entityLike);
	}

	/**
	 * Saves all given entities in the database.
	 * If entities do not exist in the database then inserts, otherwise updates.
	 */
	static save<T extends ObjectLiteral>(
		this: T,
		entities: DeepPartial<T>[],
		options?: SaveOptions
	): Promise<T[]>;

	/**
	 * Saves a given entity in the database.
	 * If entity does not exist in the database then inserts, otherwise updates.
	 */
	static save<T extends ObjectLiteral>(
		this: T,
		entity: DeepPartial<T>,
		options?: SaveOptions
	): Promise<T>;

	/**
	 * Saves one or many given entities.
	 */
	static save<T extends ObjectLiteral>(
		this: T,
		entityOrEntities: DeepPartial<T> | DeepPartial<T>[],
		options?: SaveOptions
	) {
		return this.getRepository().save(entityOrEntities as any, options);
	}

	/**
	 * Removes a given entities from the database.
	 */
	static remove<T extends ObjectLiteral>(
		this: T,
		entities: T[],
		options?: RemoveOptions
	): Promise<T[]>;

	/**
	 * Removes a given entity from the database.
	 */
	static remove<T extends ObjectLiteral>(
		this: T,
		entity: T,
		options?: RemoveOptions
	): Promise<T>;

	/**
	 * Removes one or many given entities.
	 */
	static remove<T extends ObjectLiteral>(
		this: T,
		entityOrEntities: T | T[],
		options?: RemoveOptions
	) {
		return this.getRepository().remove(entityOrEntities as any, options);
	}

	/**
	 * Records the delete date of all given entities.
	 */
	static softRemove<T extends ObjectLiteral>(
		this: T,
		entities: T[],
		options?: SaveOptions
	): Promise<T[]>;

	/**
	 * Records the delete date of a given entity.
	 */
	static softRemove<T extends ObjectLiteral>(
		this: T,
		entity: T,
		options?: SaveOptions
	): Promise<T>;

	/**
	 * Records the delete date of one or many given entities.
	 */
	static softRemove<T extends ObjectLiteral>(
		this: T,
		entityOrEntities: T | T[],
		options?: SaveOptions
	) {
		return this.getRepository().softRemove(
			entityOrEntities as any,
			options
		);
	}

	/**
	 * Inserts a given entity into the database.
	 * Unlike save method executes a primitive operation without cascades, relations and other operations included.
	 * Executes fast and efficient INSERT query.
	 * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
	 */
	static insert<T extends ObjectLiteral>(
		this: T,
		entity: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[]
	): Promise<InsertResult> {
		return this.getRepository().insert(entity);
	}

	/**
	 * Updates entity partially. Entity can be found by a given conditions.
	 * Unlike save method executes a primitive operation without cascades, relations and other operations included.
	 * Executes fast and efficient UPDATE query.
	 * Does not check if entity exist in the database.
	 */
	static update<T extends ObjectLiteral>(
		this: T,
		criteria:
			| string
			| string[]
			| number
			| number[]
			| Date
			| Date[]
			| ObjectId
			| ObjectId[]
			| FindOptionsWhere<T>,
		partialEntity: QueryDeepPartialEntity<T>
	): Promise<UpdateResult> {
		return this.getRepository().update(criteria, partialEntity);
	}

	/**
	 * Inserts a given entity into the database, unless a unique constraint conflicts then updates the entity
	 * Unlike save method executes a primitive operation without cascades, relations and other operations included.
	 * Executes fast and efficient INSERT ... ON CONFLICT DO UPDATE/ON DUPLICATE KEY UPDATE query.
	 */
	static upsert<T extends ObjectLiteral>(
		this: T,
		entityOrEntities:
			| QueryDeepPartialEntity<T>
			| QueryDeepPartialEntity<T>[],
		conflictPathsOrOptions: string[] | UpsertOptions<T>
	): Promise<InsertResult> {
		return this.getRepository().upsert(
			entityOrEntities,
			conflictPathsOrOptions
		);
	}

	/**
	 * Deletes entities by a given criteria.
	 * Unlike remove method executes a primitive operation without cascades, relations and other operations included.
	 * Executes fast and efficient DELETE query.
	 * Does not check if entity exist in the database.
	 */
	static delete<T extends ObjectLiteral>(
		this: T,
		criteria:
			| string
			| string[]
			| number
			| number[]
			| Date
			| Date[]
			| ObjectId
			| ObjectId[]
			| FindOptionsWhere<T>
	): Promise<DeleteResult> {
		return this.getRepository().delete(criteria);
	}

	/**
	 * Counts entities that match given options.
	 */
	static count<T extends ObjectLiteral>(
		this: T,
		options?: FindManyOptions<T>
	): Promise<number> {
		return this.getRepository().count(options);
	}

	/**
	 * Counts entities that match given WHERE conditions.
	 */
	static countBy<T extends ObjectLiteral>(
		this: T,
		where: FindOptionsWhere<T>
	): Promise<number> {
		return this.getRepository().countBy(where);
	}

	/**
	 * Return the SUM of a column
	 */
	static sum<T extends ObjectLiteral>(
		this: T,
		columnName: PickKeysByType<T, number>,
		where: FindOptionsWhere<T>
	): Promise<number | null> {
		return this.getRepository().sum(columnName, where);
	}

	/**
	 * Return the AVG of a column
	 */
	static average<T extends ObjectLiteral>(
		this: T,
		columnName: PickKeysByType<T, number>,
		where: FindOptionsWhere<T>
	): Promise<number | null> {
		return this.getRepository().average(columnName, where);
	}

	/**
	 * Return the MIN of a column
	 */
	static minimum<T extends ObjectLiteral>(
		this: T,
		columnName: PickKeysByType<T, number>,
		where: FindOptionsWhere<T>
	): Promise<number | null> {
		return this.getRepository().minimum(columnName, where);
	}

	/**
	 * Return the MAX of a column
	 */
	static maximum<T extends ObjectLiteral>(
		this: T,
		columnName: PickKeysByType<T, number>,
		where: FindOptionsWhere<T>
	): Promise<number | null> {
		return this.getRepository().maximum(columnName, where);
	}

	/**
	 * Finds entities that match given options.
	 */
	static find<T extends ObjectLiteral>(
		this: T,
		options?: FindManyOptions<T>
	): Promise<T[]> {
		return this.getRepository().find(options);
	}

	/**
	 * Finds entities that match given WHERE conditions.
	 */
	static findBy<T extends ObjectLiteral>(
		this: T,
		where: FindOptionsWhere<T>
	): Promise<T[]> {
		return this.getRepository().findBy(where);
	}

	/**
	 * Finds entities that match given find options.
	 * Also counts all entities that match given conditions,
	 * but ignores pagination settings (from and take options).
	 */
	static findAndCount<T extends ObjectLiteral>(
		this: T,
		options?: FindManyOptions<T>
	): Promise<[T[], number]> {
		return this.getRepository().findAndCount(options);
	}

	/**
	 * Finds entities that match given WHERE conditions.
	 * Also counts all entities that match given conditions,
	 * but ignores pagination settings (from and take options).
	 */
	static findAndCountBy<T extends ObjectLiteral>(
		this: T,
		where: FindOptionsWhere<T>
	): Promise<[T[], number]> {
		return this.getRepository().findAndCountBy(where);
	}

	/**
	 * Finds entities by ids.
	 * Optionally find options can be applied.
	 *
	 * @deprecated use `findBy` method instead in conjunction with `In` operator, for example:
	 *
	 * .findBy({
	 *     id: In([1, 2, 3])
	 * })
	 */
	static findByIds<T extends ObjectLiteral>(
		this: T,
		ids: any[]
	): Promise<T[]> {
		return this.getRepository().findByIds(ids);
	}

	/**
	 * Finds first entity that matches given conditions.
	 */
	static findOne<T extends ObjectLiteral>(
		this: T,
		options: FindOneOptions<T>
	): Promise<T | null> {
		return this.getRepository().findOne(options);
	}

	/**
	 * Finds first entity that matches given conditions.
	 */
	static findOneBy<T extends ObjectLiteral>(
		this: T,
		where: FindOptionsWhere<T>
	): Promise<T | null> {
		return this.getRepository().findOneBy(where);
	}

	/**
	 * Finds first entity that matches given options.
	 *
	 * @deprecated use `findOneBy` method instead in conjunction with `In` operator, for example:
	 *
	 * .findOneBy({
	 *     id: 1 // where "id" is your primary column name
	 * })
	 */
	static findOneById<T extends ObjectLiteral>(
		this: T,
		id: string | number | Date | ObjectId
	): Promise<T | null> {
		return this.getRepository().findOneById(id);
	}

	/**
	 * Finds first entity that matches given conditions.
	 */
	static findOneOrFail<T extends ObjectLiteral>(
		this: T,
		options: FindOneOptions<T>
	): Promise<T> {
		return this.getRepository().findOneOrFail(options);
	}

	/**
	 * Finds first entity that matches given conditions.
	 */
	static findOneByOrFail<T extends ObjectLiteral>(
		this: T,
		where: FindOptionsWhere<T>
	): Promise<T> {
		return this.getRepository().findOneByOrFail(where);
	}

	/**
	 * Executes a raw SQL query and returns a raw database results.
	 * Raw query execution is supported only by relational databases (MongoDB is not supported).
	 */
	static query<T extends ObjectLiteral>(
		this: T,
		query: string,
		parameters?: any[]
	): Promise<any> {
		return this.getRepository().query(query, parameters);
	}

	/**
	 * Clears all the data from the given table/collection (truncates/drops it).
	 */
	static clear<T extends ObjectLiteral>(this: T): Promise<void> {
		return this.getRepository().clear();
	}

	/** Moleculer-db methods */

	/**
	 * Convert DB entity to JSON object
	 *
	 * @param {any} entity
	 * @returns {Object}
	 * @memberof TypeOrmDbAdapter
	 */
	entityToObject(entity: any): object {
		return entity;
	}

	/**
	 * Transforms 'idField' into NeDB's '_id'
	 * @param {Object} entity
	 * @param {String} idField
	 * @memberof TypeOrmDbAdapter
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
	 * @memberof TypeOrmDbAdapter
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
