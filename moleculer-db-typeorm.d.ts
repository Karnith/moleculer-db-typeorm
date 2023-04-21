declare module "moleculer-db-typeorm" {
	import type { Context, ServiceBroker, Service } from "moleculer";
	import {
		DeleteResult,
		RemoveOptions,
		SaveOptions,
		DataSource,
		DeepPartial,
		EntityTarget,
		InsertResult,
		ObjectLiteral,
		Repository,
		SelectQueryBuilder,
		FindOptionsWhere,
		ObjectId,
		UpdateResult,
		FindManyOptions,
		FindOneOptions,
		DataSourceOptions,
	} from "typeorm";
	import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
	import { UpsertOptions } from "typeorm/repository/UpsertOptions";
	import { PickKeysByType } from "typeorm/common/PickKeysByType";

	export interface QueryFilters extends FilterOptions {
		sort?: string;
	}

	namespace Populate {
		function HandlerFunctionRule(
			ids: any[],
			items: any[],
			rule: HandlerRule,
			ctx: Context
		): any;
		type CommonRule = {
			field?: string;
			params?: DbContextSanitizedParams;
		};
		type ActionRule = CommonRule & { action: string };
		type HandlerRule = CommonRule & { handler: typeof HandlerFunctionRule };
		type Rule =
			| string
			| ActionRule
			| HandlerRule
			| typeof HandlerFunctionRule;
	}
	export interface DbServiceSettings {
		/**
		 *  Name of ID field.
		 *  @default "_id"
		 */
		idField?: string;

		/**
		 *  Field filtering list. It must be an `Array`. If the value is `null` or `undefined` doesn't filter the fields of entities.
		 */
		fields?: string[];

		/**
		 * List of excluded fields. It must be an `Array`. The value is `null` or `undefined` will be ignored.
		 */
		excludeFields?: string[];

		/**
		 *  Schema for population.
		 *  @see https://moleculer.services/docs/0.14/moleculer-db.html#Populating
		 */
		populates?: { [k: string]: Populate.Rule };

		/**
		 * Default page size in `list` action.
		 * @default 10
		 */
		pageSize?: number;

		/**
		 * Maximum page size in `list` action.
		 * @default 100
		 */
		maxPageSize?: number;

		/**
		 * Maximum value of limit in `find` action.
		 * @default `-1` (no limit)
		 */
		maxLimit?: number;

		/**
		 * Validator schema or a function to validate the incoming entity in `create` & 'insert' actions.
		 */
		entityValidator?: object | Function;
	}

	export interface QueryOptions {
		[name: string]: any;
	}
	export interface CursorOptions extends FilterOptions {
		sort?: string | string[];
		fields?: string | string[];
	}

	export interface FilterOptions {
		limit?: string | number;
		offset?: string | number;
		searchFields?: string | string[];
		search?: string;
		query?: QueryOptions;
	}

	export interface CountOptions {
		searchFields?: string | string[];
		search?: string;
		query?: QueryOptions;
	}

	export interface DbAdapter {
		/**
		 * Initialize adapter
		 *
		 * @param {ServiceBroker} broker
		 * @param {Service} service
		 * @memberof DbAdapter
		 */
		init(broker: ServiceBroker, service: Service): void;
		/**
		 * Connect to database
		 *
		 * @returns {Promise}
		 * @memberof DbAdapter
		 */
		connect(): Promise<void>;
		/**
		 * Disconnect from database
		 *
		 * @returns {Promise}
		 * @memberof DbAdapter
		 */
		disconnect(): Promise<void>;

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
		 * @memberof DbAdapter
		 */
		find(filters: FilterOptions): Promise<object[]>;

		/**
		 * Find an entity by query
		 *
		 * @param {Object} query
		 * @returns {Promise}
		 * @memberof DbAdapter
		 */
		findOne<Q extends QueryOptions>(query: Q): Promise<object>;

		/**
		 * Find an entity by ID
		 *
		 * @param {any} id
		 * @returns {Promise}
		 * @memberof DbAdapter
		 */
		findById(id: any): Promise<object>;

		/**
		 * Find all entites by IDs
		 *
		 * @param {Array<Number>} ids
		 * @returns {Promise}
		 * @memberof DbAdapter
		 */
		findByIds(ids: (string | number)[]): Promise<object[]>;

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
		 * @memberof DbAdapter
		 */
		count(filters?: CountOptions): Promise<number>;

		/**
		 * Insert an entity
		 *
		 * @param {Object} entity
		 * @returns {Promise}
		 * @memberof MemoryDbAdapter
		 */
		insert(entity: object): Promise<object>;

		/**
		 * Insert multiple entities
		 *
		 * @param {Array<Object>} entities
		 * @returns {Promise}
		 * @memberof MemoryDbAdapter
		 */
		insertMany(...entities: object[]): Promise<object[]>;

		/**
		 * Update many entities by `query` and `update`
		 *
		 * @param {Object} query
		 * @param {Object} update
		 * @returns {Promise}
		 * @memberof DbAdapter
		 */
		updateMany<Q extends QueryOptions>(
			query: Q,
			update: object
		): Promise<number>;

		/**
		 * Update an entity by ID
		 *
		 * @param {string|number} id
		 * @param {Object} update
		 * @returns {Promise}
		 * @memberof DbAdapter
		 */
		updateById(id: string | number, update: object): Promise<object>;

		/**
		 * Remove many entities which are matched by `query`
		 *
		 * @param {Object} query
		 * @returns {Promise}
		 * @memberof DbAdapter
		 */
		removeMany(query: QueryOptions): Promise<number>;

		/**
		 * Remove an entity by ID
		 *
		 * @param {number|string} id
		 * @returns {Promise}
		 * @memberof DbAdapter
		 */
		removeById(id: number | string): Promise<any>;

		/**
		 * Clear all entities from DB
		 *
		 * @returns {Promise}
		 * @memberof DbAdapter
		 */
		clear(): Promise<void>;

		/**
		 * Convert DB entity to JSON object
		 *
		 * @param {any} entity
		 * @returns {Object}
		 * @memberof DbAdapter
		 */
		entityToObject(entity: any): object;

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
		 * @returns {any}
		 * @memberof DbAdapter
		 */
		createCursor(params: CursorOptions): any;

		/**
		 * Transforms 'idField' into NeDB's '_id'
		 * @param {Object} entity
		 * @param {String} idField
		 * @memberof DbAdapter
		 * @returns {Object} Modified entity
		 */
		beforeSaveTransformID(entity: object, idField: string): object;

		/**
		 * Transforms NeDB's '_id' into user defined 'idField'
		 * @param {Object} entity
		 * @param {String} idField
		 * @memberof DbAdapter
		 * @returns {Object} Modified entity
		 */
		afterRetrieveTransformID(entity: object, idField: string): object;
	}

	export interface TypeORMAdapter {
		/**
		 * Initialize adapter
		 *
		 * @param {ServiceBroker} broker
		 * @param {Service} service
		 * @memberof TypeORMDbAdapter
		 */
		init(broker: ServiceBroker, service: Service): void;
		/**
		 * Connect to database
		 *
		 * @returns {Promise}
		 * @memberof TypeORMDbAdapter
		 */
		connect(): Promise<void>;
		/**
		 * Disconnect from database
		 *
		 * @returns {Promise}
		 * @memberof TypeORMDbAdapter
		 */
		disconnect(): Promise<void>;

		hasId(entity?: any): boolean;

		/**
		 * Saves current entity in the database.
		 * If entity does not exist in the database then inserts, otherwise updates.
		 */
		save(options?: SaveOptions): Promise<object>;

		/**
		 * Removes current entity from the database.
		 */
		remove(options?: RemoveOptions): Promise<object>;

		/**
		 * Records the delete date of current entity.
		 */
		softRemove(options?: SaveOptions): Promise<object>;

		/**
		 * Recovers a given entity in the database.
		 */
		recover(options?: SaveOptions): Promise<object>;
		/**
		 * Reloads entity data from the database.
		 */
		reload(): Promise<void>;

		// -------------------------------------------------------------------------
		// Public Static Methods
		// -------------------------------------------------------------------------

		/**
		 * Gets current entity's Repository.
		 */
		getRepository<T extends ObjectLiteral>(this: T): Repository<T>;

		/**
		 * Returns object that is managed by this repository.
		 * If this repository manages entity from schema,
		 * then it returns a name of that schema instead.
		 */
		get target(): EntityTarget<any>;

		/**
		 * Gets entity mixed id.
		 */
		getId<T extends ObjectLiteral>(this: T, entity: T): any;

		/**
		 * Creates a new query builder that can be used to build a SQL query.
		 */
		createQueryBuilder<T extends ObjectLiteral>(
			this: T,
			alias?: string
		): SelectQueryBuilder<T>;

		/**
		 * Creates a new entity instance.
		 */
		create<T extends ObjectLiteral>(this: T): T;

		/**
		 * Creates a new entities and copies all entity properties from given objects into their new entities.
		 * Note that it copies only properties that present in entity schema.
		 */
		create<T extends ObjectLiteral>(
			this: T,
			entityLikeArray: DeepPartial<T>[]
		): T[];

		/**
		 * Creates a new entity instance and copies all entity properties from this object into a new entity.
		 * Note that it copies only properties that present in entity schema.
		 */
		create<T extends ObjectLiteral>(this: T, entityLike: DeepPartial<T>): T;

		/**
		 * Creates a new entity instance and copies all entity properties from this object into a new entity.
		 * Note that it copies only properties that present in entity schema.
		 */
		create<T extends ObjectLiteral>(
			this: T,
			entityOrEntities?: any
		): Promise<T | T[]>;

		/**
		 * Merges multiple entities (or entity-like objects) into a given entity.
		 */
		merge<T extends ObjectLiteral>(
			this: T,
			mergeIntoEntity: T,
			...entityLikes: DeepPartial<T>[]
		): T;

		/**
		 * Creates a new entity from the given plain javascript object. If entity already exist in the database, then
		 * it loads it (and everything related to it), replaces all values with the new ones from the given object
		 * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
		 * replaced from the new object.
		 *
		 * Note that given entity-like object must have an entity id / primary key to find entity by.
		 * Returns undefined if entity with given id was not found.
		 */
		preload<T extends ObjectLiteral>(
			this: T,
			entityLike: DeepPartial<T>
		): Promise<T | undefined>;

		/**
		 * Saves all given entities in the database.
		 * If entities do not exist in the database then inserts, otherwise updates.
		 */
		save<T extends ObjectLiteral>(
			this: T,
			entities: DeepPartial<T>[],
			options?: SaveOptions
		): Promise<T[]>;

		/**
		 * Saves a given entity in the database.
		 * If entity does not exist in the database then inserts, otherwise updates.
		 */
		save<T extends ObjectLiteral>(
			this: T,
			entity: DeepPartial<T>,
			options?: SaveOptions
		): Promise<T>;

		/**
		 * Saves one or many given entities.
		 */
		save<T extends ObjectLiteral>(
			this: T,
			entityOrEntities: DeepPartial<T> | DeepPartial<T>[],
			options?: SaveOptions
		): Promise<T | T[]>;

		/**
		 * Removes a given entities from the database.
		 */
		remove<T extends ObjectLiteral>(
			this: T,
			entities: T[],
			options?: RemoveOptions
		): Promise<T[]>;

		/**
		 * Removes a given entity from the database.
		 */
		remove<T extends ObjectLiteral>(
			this: T,
			entity: T,
			options?: RemoveOptions
		): Promise<T>;

		/**
		 * Removes one or many given entities.
		 */
		remove<T extends ObjectLiteral>(
			this: T,
			entityOrEntities: T | T[],
			options?: RemoveOptions
		): Promise<T | T[]>;

		/**
		 * Records the delete date of all given entities.
		 */
		softRemove<T extends ObjectLiteral>(
			this: T,
			entities: T[],
			options?: SaveOptions
		): Promise<T[]>;

		/**
		 * Records the delete date of a given entity.
		 */
		softRemove<T extends ObjectLiteral>(
			this: T,
			entity: T,
			options?: SaveOptions
		): Promise<T>;

		/**
		 * Records the delete date of one or many given entities.
		 */
		softRemove<T extends ObjectLiteral>(
			this: T,
			entityOrEntities: T | T[],
			options?: SaveOptions
		): Promise<T | T[]>;

		/**
		 * Inserts a given entity into the database.
		 * Unlike save method executes a primitive operation without cascades, relations and other operations included.
		 * Executes fast and efficient INSERT query.
		 * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
		 */
		insert<T extends ObjectLiteral>(
			this: T,
			entity: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[]
		): Promise<InsertResult>;

		/**
		 * Updates entity partially. Entity can be found by a given conditions.
		 * Unlike save method executes a primitive operation without cascades, relations and other operations included.
		 * Executes fast and efficient UPDATE query.
		 * Does not check if entity exist in the database.
		 */
		update<T extends ObjectLiteral>(
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
		): Promise<UpdateResult>;

		/**
		 * Inserts a given entity into the database, unless a unique constraint conflicts then updates the entity
		 * Unlike save method executes a primitive operation without cascades, relations and other operations included.
		 * Executes fast and efficient INSERT ... ON CONFLICT DO UPDATE/ON DUPLICATE KEY UPDATE query.
		 */
		upsert<T extends ObjectLiteral>(
			this: T,
			entityOrEntities:
				| QueryDeepPartialEntity<T>
				| QueryDeepPartialEntity<T>[],
			conflictPathsOrOptions: string[] | UpsertOptions<T>
		): Promise<InsertResult>;

		/**
		 * Deletes entities by a given criteria.
		 * Unlike remove method executes a primitive operation without cascades, relations and other operations included.
		 * Executes fast and efficient DELETE query.
		 * Does not check if entity exist in the database.
		 */
		delete<T extends ObjectLiteral>(
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
		): Promise<DeleteResult>;

		/**
		 * Counts entities that match given options.
		 */
		count<T extends ObjectLiteral>(
			this: T,
			options?: FindManyOptions<T>
		): Promise<number>;

		/**
		 * Counts entities that match given WHERE conditions.
		 */
		countBy<T extends ObjectLiteral>(
			this: T,
			where: FindOptionsWhere<T>
		): Promise<number>;

		/**
		 * Return the SUM of a column
		 */
		sum<T extends ObjectLiteral>(
			this: T,
			columnName: PickKeysByType<T, number>,
			where: FindOptionsWhere<T>
		): Promise<number | null>;

		/**
		 * Return the AVG of a column
		 */
		average<T extends ObjectLiteral>(
			this: T,
			columnName: PickKeysByType<T, number>,
			where: FindOptionsWhere<T>
		): Promise<number | null>;

		/**
		 * Return the MIN of a column
		 */
		minimum<T extends ObjectLiteral>(
			this: T,
			columnName: PickKeysByType<T, number>,
			where: FindOptionsWhere<T>
		): Promise<number | null>;

		/**
		 * Return the MAX of a column
		 */
		maximum<T extends ObjectLiteral>(
			this: T,
			columnName: PickKeysByType<T, number>,
			where: FindOptionsWhere<T>
		): Promise<number | null>;

		/**
		 * Finds entities that match given options.
		 */
		find<T extends ObjectLiteral>(
			this: T,
			options?: FindManyOptions<T>
		): Promise<T[]>;

		/**
		 * Finds entities that match given WHERE conditions.
		 */
		findBy<T extends ObjectLiteral>(
			this: T,
			where: FindOptionsWhere<T>
		): Promise<T[]>;

		/**
		 * Finds entities that match given find options.
		 * Also counts all entities that match given conditions,
		 * but ignores pagination settings (from and take options).
		 */
		findAndCount<T extends ObjectLiteral>(
			this: T,
			options?: FindManyOptions<T>
		): Promise<[T[], number]>;

		/**
		 * Finds entities that match given WHERE conditions.
		 * Also counts all entities that match given conditions,
		 * but ignores pagination settings (from and take options).
		 */
		findAndCountBy<T extends ObjectLiteral>(
			this: T,
			where: FindOptionsWhere<T>
		): Promise<[T[], number]>;

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
		findByIds<T extends ObjectLiteral>(this: T, ids: any[]): Promise<T[]>;

		/**
		 * Finds first entity that matches given conditions.
		 */
		findOne<T extends ObjectLiteral>(
			this: T,
			options: FindOneOptions<T>
		): Promise<T | null>;

		/**
		 * Finds first entity that matches given conditions.
		 */
		findOneBy<T extends ObjectLiteral>(
			this: T,
			where: FindOptionsWhere<T>
		): Promise<T | null>;

		/**
		 * Finds first entity that matches given options.
		 *
		 * @deprecated use `findOneBy` method instead in conjunction with `In` operator, for example:
		 *
		 * .findOneBy({
		 *     id: 1 // where "id" is your primary column name
		 * })
		 */
		findOneById<T extends ObjectLiteral>(
			this: T,
			id: string | number | Date | ObjectId
		): Promise<T | null>;

		/**
		 * Finds first entity that matches given conditions.
		 */
		findOneOrFail<T extends ObjectLiteral>(
			this: T,
			options: FindOneOptions<T>
		): Promise<T>;

		/**
		 * Finds first entity that matches given conditions.
		 */
		findOneByOrFail<T extends ObjectLiteral>(
			this: T,
			where: FindOptionsWhere<T>
		): Promise<T>;

		/**
		 * Executes a raw SQL query and returns a raw database results.
		 * Raw query execution is supported only by relational databases (MongoDB is not supported).
		 */
		query<T extends ObjectLiteral>(
			this: T,
			query: string,
			parameters?: any[]
		): Promise<any>;

		/**
		 * Clears all the data from the given table/collection (truncates/drops it).
		 */
		clear<T extends ObjectLiteral>(this: T): Promise<void>;

		/**
		 * Convert DB entity to JSON object
		 *
		 * @param {any} entity
		 * @returns {Object}
		 * @memberof DbAdapter
		 */
		entityToObject(entity: any): object;

		/**
		 * Transforms 'idField' into NeDB's '_id'
		 * @param {Object} entity
		 * @param {String} idField
		 * @memberof DbAdapter
		 * @returns {Object} Modified entity
		 */
		beforeSaveTransformID(entity: object, idField: string): object;

		/**
		 * Transforms NeDB's '_id' into user defined 'idField'
		 * @param {Object} entity
		 * @param {String} idField
		 * @memberof DbAdapter
		 * @returns {Object} Modified entity
		 */
		afterRetrieveTransformID(entity: object, idField: string): object;
	}
	export interface DbContextParameters {
		limit?: string | number;
		offset?: string | number;
		page?: string | number;
		pageSize?: string | number;
		sort?: string | string[];
		fields?: string | string[];
		populate?: string | string[];
		searchFields?: string | string[];
	}
	export type DbContextSanitizedParams = DbContextParameters & {
		query?: QueryOptions;
	};

	export interface MoleculerDbMethods {
		connect(): Promise<void>;
		/**
		 * Disconnect from database.
		 */
		disconnect(): Promise<void>;
		/**
		 * Sanitize context parameters at `find` action.
		 *
		 * @param {Context} ctx
		 * @param {any?} params
		 * @returns {Object}
		 */
		sanitizeParams(
			ctx: Context,
			params?: DbContextParameters & {
				query?: QueryOptions | any;
			}
		): DbContextSanitizedParams;

		/**
		 * Get entity(ies) by ID(s).
		 *
		 * @methods
		 * @param {String|Number|Array} id - ID or IDs.
		 * @param {Boolean} decoding - Need to decode IDs.
		 * @returns {Object|Array<Object>} Found entity(ies).
		 */
		getById(
			id: string | number | string[],
			decoding?: boolean
		): Promise<object | object[]>;
		/**
		 * Clear the cache & call entity lifecycle events
		 *
		 * @param {String} type
		 * @param {Object|Array|Number} json
		 * @param {Context} ctx
		 * @returns {Promise}
		 */
		entityChanged(
			type: string,
			json: number | any[] | any,
			ctx: Context
		): Promise<void>;

		/**
		 * Clear cached entities
		 *
		 * @methods
		 * @returns {Promise}
		 */
		clearCache(): Promise<void>;

		/**
		 * Transform the fetched documents
		 *
		 * @param {Array|Object} 	docs
		 * @param {Object} params
		 * @param {Context} ctx
		 * @returns {Array|Object}
		 */
		transformDocuments(
			ctx: Context,
			params: object,
			docs: any[] | object
		): any;
		/**
		 * Filter fields in the entity object
		 *
		 * @param {Object} 	doc
		 * @param {Array} 	fields	Filter properties of model.
		 * @returns	{Object}
		 */
		filterFields(doc: any, fields: any[]): object;
		/**
		 * Exclude fields in the entity object
		 *
		 * @param {Object} 	doc
		 * @param {Array} 	fields	Exclude properties of model.
		 * @returns	{Object}
		 */
		excludeFields(doc: any, fields: any[]): object;

		/**
		 * Authorize the required field list. Remove fields which is not exist in the `this.settings.fields`
		 *
		 * @param {Array} fields
		 * @returns {Array}
		 */
		authorizeFields(fields: any[]): any[];

		/**
		 * Populate documents.
		 *
		 * @param {Context} 		ctx
		 * @param {Array|Object} 	docs
		 * @param {Array}			populateFields
		 * @returns	{Promise}
		 */
		populateDocs(
			ctx: Context,
			docs: any,
			populateFields: any[]
		): Promise<any>;

		/**
		 * Validate an entity by validator.
		 *
		 * @param {Object} entity
		 * @returns {Promise}
		 */
		validateEntity(entity: object): Promise<any>;

		/**
		 * Encode ID of entity.
		 *
		 * @methods
		 * @param {any} id
		 * @returns {any}
		 */
		encodeID(id: any): any;

		/**
		 * Decode ID of entity.
		 *
		 * @methods
		 * @param {any} id
		 * @returns {any}
		 */
		decodeID(id: any): any;

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
		_find(ctx: Context, params?: FilterOptions): object[];

		/**
		 * Get count of entities by query.
		 * @methods
		 */
		_count(ctx: Context, params?: CountOptions): number;

		/**
		 * List entities by filters and pagination results.
		 * @methods
		 */
		_list(
			ctx: Context,
			params?: DbContextSanitizedParams
		): {
			rows: object[];
			total: number;
			page: number;
			pageSize: number;
			totalPages: number;
		};
		/**
		 * Create a new entity.
		 * @methods
		 */
		_create(ctx: Context, params: object): Promise<object>;

		/**
		 * Create many new entities.
		 * @methods
		 */
		_insert(ctx: Context, params: object): Promise<object>;
		_insert(ctx: Context, params: object[]): Promise<object[]>;

		/**
		 * Get entity by ID.
		 * @methods
		 */
		_get(
			ctx: Context,
			params: { id: any | any[]; mapping?: boolean } & Partial<
				Pick<DbContextParameters, "populate" | "fields">
			>
		): Promise<object | object[]>;

		/**
		 * Update an entity by ID.
		 * > After update, clear the cache & call lifecycle events.
		 * @methods
		 */
		_update(ctx: Context, params: object): Promise<object>;

		/**
		 * Remove an entity by ID.
		 * @methods
		 */
		_remove(ctx: Context, params: { id: any }): Promise<object>;
	}

	export interface MoleculerDB<TAdapter extends DbAdapter> {
		name?: string;
		metadata?: {
			$category: string;
			$official: boolean;
			$name: string;
			$version: string;
			$repo?: string;
		};
		// Store adapter (NeDB adapter is the default)
		adapter?: TAdapter;
		/**
		 * Default settings
		 */
		settings?: DbServiceSettings;

		/**
		 * Actions
		 */
		actions?: {
			/**
			 * Find entities by query.
			 *
			 * @actions
			 * @cached
			 *
			 * @param {Array<String>?} populate - Populated fields.
			 * @param {Array<String>?} fields - Fields filter.
			 * @param {Number} limit - Max count of rows.
			 * @param {Number} offset - Count of skipped rows.
			 * @param {String} sort - Sorted fields.
			 * @param {String} search - Search text.
			 * @param {String} searchFields - Fields for searching.
			 * @param {Object} query - Query object. Passes to adapter.
			 *
			 * @returns {Array<Object>} List of found entities.
			 */
			find?: {
				cache?: {
					keys: (
						| "populate"
						| "fields"
						| "limit"
						| "offset"
						| "sort"
						| "search"
						| "searchFields"
						| "query"
						| any
					)[];
				};
				params?: DbContextParameters & {
					query?: any;
				};
				handler?(ctx: Context): Promise<object[]>;
			};
		};

		/**
		 * Methods
		 */
		methods?: Partial<MoleculerDbMethods>;
	}

	export class TypeORMDbAdapter implements TypeORMAdapter {
		constructor(opts?: DataSourceOptions);
		/**
		 * Initialize adapter
		 *
		 * @param {ServiceBroker} broker
		 * @param {Service} service
		 * @memberof DbAdapter
		 */
		init(broker: ServiceBroker, service: Service): void;
		/**
		 * Connect to database
		 *
		 * @returns {Promise}
		 * @memberof DbAdapter
		 */
		connect(): Promise<void>;
		/**
		 * Disconnect from database
		 *
		 * @returns {Promise}
		 * @memberof DbAdapter
		 */
		disconnect(): Promise<void>;

		hasId(entity?: any): boolean;

		/**
		 * Saves current entity in the database.
		 * If entity does not exist in the database then inserts, otherwise updates.
		 */
		save(options?: SaveOptions): Promise<object>;

		/**
		 * Removes current entity from the database.
		 */
		remove(options?: RemoveOptions): Promise<object>;

		/**
		 * Records the delete date of current entity.
		 */
		softRemove(options?: SaveOptions): Promise<object>;

		/**
		 * Recovers a given entity in the database.
		 */
		recover(options?: SaveOptions): Promise<object>;
		/**
		 * Reloads entity data from the database.
		 */
		reload(): Promise<void>;

		// -------------------------------------------------------------------------
		// Public Static Methods
		// -------------------------------------------------------------------------

		/**
		 * Gets current entity's Repository.
		 */
		getRepository<T extends ObjectLiteral>(this: T): Repository<T>;

		/**
		 * Returns object that is managed by this repository.
		 * If this repository manages entity from schema,
		 * then it returns a name of that schema instead.
		 */
		get target(): EntityTarget<any>;

		/**
		 * Gets entity mixed id.
		 */
		getId<T extends ObjectLiteral>(this: T, entity: T): any;

		/**
		 * Creates a new query builder that can be used to build a SQL query.
		 */
		createQueryBuilder<T extends ObjectLiteral>(
			this: T,
			alias?: string
		): SelectQueryBuilder<T>;

		/**
		 * Creates a new entity instance.
		 */
		create<T extends ObjectLiteral>(this: T): T;

		/**
		 * Creates a new entities and copies all entity properties from given objects into their new entities.
		 * Note that it copies only properties that present in entity schema.
		 */
		create<T extends ObjectLiteral>(
			this: T,
			entityLikeArray: DeepPartial<T>[]
		): T[];

		/**
		 * Creates a new entity instance and copies all entity properties from this object into a new entity.
		 * Note that it copies only properties that present in entity schema.
		 */
		create<T extends ObjectLiteral>(this: T, entityLike: DeepPartial<T>): T;

		/**
		 * Creates a new entity instance and copies all entity properties from this object into a new entity.
		 * Note that it copies only properties that present in entity schema.
		 */
		create<T extends ObjectLiteral>(
			this: T,
			entityOrEntities?: any
		): Promise<T | T[]>;

		/**
		 * Merges multiple entities (or entity-like objects) into a given entity.
		 */
		merge<T extends ObjectLiteral>(
			this: T,
			mergeIntoEntity: T,
			...entityLikes: DeepPartial<T>[]
		): T;

		/**
		 * Creates a new entity from the given plain javascript object. If entity already exist in the database, then
		 * it loads it (and everything related to it), replaces all values with the new ones from the given object
		 * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
		 * replaced from the new object.
		 *
		 * Note that given entity-like object must have an entity id / primary key to find entity by.
		 * Returns undefined if entity with given id was not found.
		 */
		preload<T extends ObjectLiteral>(
			this: T,
			entityLike: DeepPartial<T>
		): Promise<T | undefined>;

		/**
		 * Saves all given entities in the database.
		 * If entities do not exist in the database then inserts, otherwise updates.
		 */
		save<T extends ObjectLiteral>(
			this: T,
			entities: DeepPartial<T>[],
			options?: SaveOptions
		): Promise<T[]>;

		/**
		 * Saves a given entity in the database.
		 * If entity does not exist in the database then inserts, otherwise updates.
		 */
		save<T extends ObjectLiteral>(
			this: T,
			entity: DeepPartial<T>,
			options?: SaveOptions
		): Promise<T>;

		/**
		 * Saves one or many given entities.
		 */
		save<T extends ObjectLiteral>(
			this: T,
			entityOrEntities: DeepPartial<T> | DeepPartial<T>[],
			options?: SaveOptions
		): Promise<T | T[]>;

		/**
		 * Removes a given entities from the database.
		 */
		remove<T extends ObjectLiteral>(
			this: T,
			entities: T[],
			options?: RemoveOptions
		): Promise<T[]>;

		/**
		 * Removes a given entity from the database.
		 */
		remove<T extends ObjectLiteral>(
			this: T,
			entity: T,
			options?: RemoveOptions
		): Promise<T>;

		/**
		 * Removes one or many given entities.
		 */
		remove<T extends ObjectLiteral>(
			this: T,
			entityOrEntities: T | T[],
			options?: RemoveOptions
		): Promise<T | T[]>;

		/**
		 * Records the delete date of all given entities.
		 */
		softRemove<T extends ObjectLiteral>(
			this: T,
			entities: T[],
			options?: SaveOptions
		): Promise<T[]>;

		/**
		 * Records the delete date of a given entity.
		 */
		softRemove<T extends ObjectLiteral>(
			this: T,
			entity: T,
			options?: SaveOptions
		): Promise<T>;

		/**
		 * Records the delete date of one or many given entities.
		 */
		softRemove<T extends ObjectLiteral>(
			this: T,
			entityOrEntities: T | T[],
			options?: SaveOptions
		): Promise<T | T[]>;

		/**
		 * Inserts a given entity into the database.
		 * Unlike save method executes a primitive operation without cascades, relations and other operations included.
		 * Executes fast and efficient INSERT query.
		 * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
		 */
		insert<T extends ObjectLiteral>(
			this: T,
			entity: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[]
		): Promise<InsertResult>;

		/**
		 * Updates entity partially. Entity can be found by a given conditions.
		 * Unlike save method executes a primitive operation without cascades, relations and other operations included.
		 * Executes fast and efficient UPDATE query.
		 * Does not check if entity exist in the database.
		 */
		update<T extends ObjectLiteral>(
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
		): Promise<UpdateResult>;

		/**
		 * Inserts a given entity into the database, unless a unique constraint conflicts then updates the entity
		 * Unlike save method executes a primitive operation without cascades, relations and other operations included.
		 * Executes fast and efficient INSERT ... ON CONFLICT DO UPDATE/ON DUPLICATE KEY UPDATE query.
		 */
		upsert<T extends ObjectLiteral>(
			this: T,
			entityOrEntities:
				| QueryDeepPartialEntity<T>
				| QueryDeepPartialEntity<T>[],
			conflictPathsOrOptions: string[] | UpsertOptions<T>
		): Promise<InsertResult>;

		/**
		 * Deletes entities by a given criteria.
		 * Unlike remove method executes a primitive operation without cascades, relations and other operations included.
		 * Executes fast and efficient DELETE query.
		 * Does not check if entity exist in the database.
		 */
		delete<T extends ObjectLiteral>(
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
		): Promise<DeleteResult>;

		/**
		 * Counts entities that match given options.
		 */
		count<T extends ObjectLiteral>(
			this: T,
			options?: FindManyOptions<T>
		): Promise<number>;

		/**
		 * Counts entities that match given WHERE conditions.
		 */
		countBy<T extends ObjectLiteral>(
			this: T,
			where: FindOptionsWhere<T>
		): Promise<number>;

		/**
		 * Return the SUM of a column
		 */
		sum<T extends ObjectLiteral>(
			this: T,
			columnName: PickKeysByType<T, number>,
			where: FindOptionsWhere<T>
		): Promise<number | null>;

		/**
		 * Return the AVG of a column
		 */
		average<T extends ObjectLiteral>(
			this: T,
			columnName: PickKeysByType<T, number>,
			where: FindOptionsWhere<T>
		): Promise<number | null>;

		/**
		 * Return the MIN of a column
		 */
		minimum<T extends ObjectLiteral>(
			this: T,
			columnName: PickKeysByType<T, number>,
			where: FindOptionsWhere<T>
		): Promise<number | null>;

		/**
		 * Return the MAX of a column
		 */
		maximum<T extends ObjectLiteral>(
			this: T,
			columnName: PickKeysByType<T, number>,
			where: FindOptionsWhere<T>
		): Promise<number | null>;

		/**
		 * Finds entities that match given options.
		 */
		find<T extends ObjectLiteral>(
			this: T,
			options?: FindManyOptions<T>
		): Promise<T[]>;

		/**
		 * Finds entities that match given WHERE conditions.
		 */
		findBy<T extends ObjectLiteral>(
			this: T,
			where: FindOptionsWhere<T>
		): Promise<T[]>;

		/**
		 * Finds entities that match given find options.
		 * Also counts all entities that match given conditions,
		 * but ignores pagination settings (from and take options).
		 */
		findAndCount<T extends ObjectLiteral>(
			this: T,
			options?: FindManyOptions<T>
		): Promise<[T[], number]>;

		/**
		 * Finds entities that match given WHERE conditions.
		 * Also counts all entities that match given conditions,
		 * but ignores pagination settings (from and take options).
		 */
		findAndCountBy<T extends ObjectLiteral>(
			this: T,
			where: FindOptionsWhere<T>
		): Promise<[T[], number]>;

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
		findByIds<T extends ObjectLiteral>(this: T, ids: any[]): Promise<T[]>;

		/**
		 * Finds first entity that matches given conditions.
		 */
		findOne<T extends ObjectLiteral>(
			this: T,
			options: FindOneOptions<T>
		): Promise<T | null>;

		/**
		 * Finds first entity that matches given conditions.
		 */
		findOneBy<T extends ObjectLiteral>(
			this: T,
			where: FindOptionsWhere<T>
		): Promise<T | null>;

		/**
		 * Finds first entity that matches given options.
		 *
		 * @deprecated use `findOneBy` method instead in conjunction with `In` operator, for example:
		 *
		 * .findOneBy({
		 *     id: 1 // where "id" is your primary column name
		 * })
		 */
		findOneById<T extends ObjectLiteral>(
			this: T,
			id: string | number | Date | ObjectId
		): Promise<T | null>;

		/**
		 * Finds first entity that matches given conditions.
		 */
		findOneOrFail<T extends ObjectLiteral>(
			this: T,
			options: FindOneOptions<T>
		): Promise<T>;

		/**
		 * Finds first entity that matches given conditions.
		 */
		findOneByOrFail<T extends ObjectLiteral>(
			this: T,
			where: FindOptionsWhere<T>
		): Promise<T>;

		/**
		 * Executes a raw SQL query and returns a raw database results.
		 * Raw query execution is supported only by relational databases (MongoDB is not supported).
		 */
		query<T extends ObjectLiteral>(
			this: T,
			query: string,
			parameters?: any[]
		): Promise<any>;

		/**
		 * Clears all the data from the given table/collection (truncates/drops it).
		 */
		clear<T extends ObjectLiteral>(this: T): Promise<void>;

		/**
		 * Convert DB entity to JSON object
		 *
		 * @param {any} entity
		 * @returns {Object}
		 * @memberof DbAdapter
		 */
		entityToObject(entity: any): object;

		/**
		 * Transforms 'idField' into NeDB's '_id'
		 * @param {Object} entity
		 * @param {String} idField
		 * @memberof DbAdapter
		 * @returns {Object} Modified entity
		 */
		beforeSaveTransformID(entity: object, idField: string): object;

		/**
		 * Transforms NeDB's '_id' into user defined 'idField'
		 * @param {Object} entity
		 * @param {String} idField
		 * @memberof DbAdapter
		 * @returns {Object} Modified entity
		 */
		afterRetrieveTransformID(entity: object, idField: string): object;
	}

	export class MemoryAdapter implements DbAdapter {
		constructor(opts?: object);
		/**
		 * Initialize adapter
		 *
		 * @param {ServiceBroker} broker
		 * @param {Service} service
		 * @typeOf DbAdapter
		 */
		init(broker: ServiceBroker, service: Service): void;

		/**
		 * Connect to database
		 *
		 * @returns {Promise}
		 * @typeOf MemoryDbAdapter
		 */
		connect(): Promise<void>;

		/**
		 * Disconnect from database
		 *
		 * @returns {Promise}
		 * @typeOf MemoryDbAdapter
		 */
		disconnect(): Promise<void>;

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
		 * @typeOf MemoryDbAdapter
		 */
		find(filters: QueryFilters): Promise<any>;
		/**
		 * Find an entity by query
		 *
		 * @param {Object} query
		 * @returns {Promise}
		 * @typeOf MemoryDbAdapter
		 */
		findOne(query: QueryOptions): Promise<object>;
		/**
		 * Find an entity by ID
		 *
		 * @param {any} _id
		 * @returns {Promise}
		 * @typeOf MemoryDbAdapter
		 */
		findById(_id: number | string): Promise<object>;
		/**
		 * Find all entites by IDs
		 *
		 * @param {Array<Number>} ids
		 * @returns {Promise}
		 * @typeOf MemoryDbAdapter
		 */
		findByIds(ids: number[]): Promise<object[]>;
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
		 * @typeOf MemoryDbAdapter
		 */
		count(filters: object): Promise<number>;
		/**
		 * Insert an entity
		 *
		 * @param {Object} entity
		 * @returns {Promise}
		 * @typeOf MemoryDbAdapter
		 */
		insert(entity: object): Promise<object>;

		/**
		 * Insert multiple entities
		 *
		 * @param {Array<Object>} entities
		 * @returns {Promise}
		 * @typeOf MemoryDbAdapter
		 */
		insertMany(entities: object[]): Promise<object[]>;

		/**
		 * Update many entities by `query` and `update`
		 *
		 * @param {Object} query
		 * @param {Object} update
		 * @returns {Promise}
		 * @typeOf MemoryDbAdapter
		 */
		updateMany(query: QueryOptions, update: object): Promise<number>;

		/**
		 * Update an entity by ID
		 *
		 * @param {any} _id
		 * @param {Object} update
		 * @returns {Promise}
		 * @typeOf MemoryDbAdapter
		 */
		updateById(_id: number | string, update: object): Promise<object>;

		/**
		 * Remove many entities which are matched by `query`
		 *
		 * @param {Object} query
		 * @returns {Promise}
		 * @typeOf MemoryDbAdapter
		 */
		removeMany(query: QueryOptions): Promise<number>;

		/**
		 * Remove an entity by ID
		 *
		 * @param {any} _id
		 * @returns {Promise}
		 * @typeOf MemoryDbAdapter
		 */
		removeById(_id: number | string): Promise<object>;

		/**
		 * Clear all entities from DB
		 *
		 * @returns {Promise}
		 * @typeOf MemoryDbAdapter
		 */
		clear(): Promise<void>;

		/**
		 * Convert DB entity to JSON object
		 *
		 * @param {any} entity
		 * @returns {Object}
		 * @typeOf MemoryDbAdapter
		 */
		entityToObject(entity: unknown): Promise<object>;

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
		 * @typeOf MemoryDbAdapter
		 */
		createCursor(params: QueryFilters): Promise<object[]> | QueryOptions;

		/**
		 * Transforms 'idField' into NeDB's '_id'
		 * @param {Object} entity
		 * @param {String} idField
		 * @typeOf MemoryDbAdapter
		 * @returns {Object} Modified entity
		 */
		beforeSaveTransformID(entity: object, idField: string): object;

		/**
		 * Transforms NeDB's '_id' into user defined 'idField'
		 * @param {Object} entity
		 * @param {String} idField
		 * @typeOf MemoryDbAdapter
		 * @returns {Object} Modified entity
		 */
		afterRetrieveTransformID(entity: object, idField: string): object;
	}
	export default class DbService<
		S extends DbServiceSettings = DbServiceSettings
	> extends Service<S> {
		static MemoryAdapter: typeof MemoryAdapter;
	}
}
