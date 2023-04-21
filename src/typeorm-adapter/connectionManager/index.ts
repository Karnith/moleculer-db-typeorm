import { isArray } from "lodash";
import {
	DataSource,
	DataSourceOptions,
	ConnectionNotFoundError,
	AlreadyHasActiveConnectionError,
} from "typeorm";

/**
 * ConnectionManager is used to store and manage multiple orm connections.
 * It also provides useful factory methods to simplify connection creation.
 *
 *
 */
export default class ConnectionManager {
	/**
	 * List of connections registered in this connection manager.
	 */
	get connections(): DataSource[] {
		return Array.from(this.connectionMap.values());
	}

	/**
	 * Internal lookup to quickly get from a connection name to the Connection object.
	 */
	private readonly connectionMap: Map<string, DataSource> = new Map();

	// -------------------------------------------------------------------------
	// Public Methods
	// -------------------------------------------------------------------------

	/**
	 * Checks if connection with the given name exist in the manager.
	 */
	has(name: string): boolean {
		return this.connectionMap.has(name);
	}

	/**
	 * Gets registered connection with the given name.
	 * If connection name is not given then it will get a default connection.
	 * Throws error if connection with the given name was not found.
	 */
	get(name: string = "default"): DataSource {
		const connection = this.connectionMap.get(name);
		if (!connection) throw new ConnectionNotFoundError(name);

		return connection;
	}

	/**
	 * Removes registered connection with the given name.
	 * If connection name is not given then it will get a default connection.
	 * Throws error if connection with the given name was not found.
	 */
	remove(name: string = "default"): void {
		const connection = this.connectionMap.get(name);
		if (!connection) throw new ConnectionNotFoundError(name);
		this.connectionMap.delete(name);
	}

	/**
	 * closes registered connection with the given name and removes it from
	 * ConnectionManager.
	 * If connection name is not given then it will get a default connection.
	 * Throws error if connection with the given name was not found.
	 */
	async close(
		name: string | Array<string> = "default"
	): Promise<boolean | Promise<boolean>[]> {
		const throwError = (name: string) => {
			throw new ConnectionNotFoundError(name);
		};
		const closeConnection = async (name: string) => {
			const connection: DataSource = this.connectionMap.get(name)!;
			await connection.destroy();
			this.remove(name);
		};
		return !isArray(name) && this.connectionMap.has(name)
			? await closeConnection(name)
					.then(() => {
						return true;
					})
					.catch(() => {
						return false;
					})
			: isArray(name)
			? name.map(async (connectionName: string) => {
					return this.connectionMap.has(connectionName)
						? await closeConnection(connectionName)
								.then(() => {
									return true;
								})
								.catch(() => {
									return false;
								})
						: throwError(connectionName);
			  })
			: throwError(name);
	}

	/**
	 * Creates a new connection based on the given connection options and registers it in the manager.
	 * Connection won't be established, you'll need to manually call connect method to establish connection.
	 */
	async create(options: DataSourceOptions): Promise<DataSource> {
		// check if such connection is already registered
		const existConnection = this.connectionMap.get(
			options.name || "default"
		);
		if (existConnection) {
			// if connection is registered and its not closed then throw an error
			if (existConnection.isInitialized)
				throw new AlreadyHasActiveConnectionError(
					options.name || "default"
				);
		}

		// create a new connection
		const connection = new DataSource(options);
		this.connectionMap.set(connection.name, connection);
		return Promise.resolve(connection);
	}
}
