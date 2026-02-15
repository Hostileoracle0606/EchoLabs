import neo4j, { Driver, Session } from 'neo4j-driver'

export interface Neo4jConfig {
    uri?: string
    username?: string
    password?: string
}

export class Neo4jClient {
    private driver: Driver | null = null
    private config: Neo4jConfig

    constructor(config: Neo4jConfig = {}) {
        this.config = config
    }

    async connect(): Promise<void> {
        if (this.driver) {
            return
        }

        const { uri, username, password } = this.config
        if (!uri || !username || !password) {
            throw new Error(
                'Neo4j connection requires NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD'
            )
        }

        this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password))

        // Verify connectivity
        await this.driver.verifyConnectivity()
    }

    async disconnect(): Promise<void> {
        if (this.driver) {
            await this.driver.close()
            this.driver = null
        }
    }

    getSession(): Session {
        if (!this.driver) {
            throw new Error('Neo4j driver not connected. Call connect() first.')
        }
        return this.driver.session()
    }

    async query<T = any>(cypher: string, params?: Record<string, any>): Promise<T[]> {
        const session = this.getSession()
        try {
            const result = await session.run(cypher, params)
            return result.records.map((record) => record.toObject() as T)
        } finally {
            await session.close()
        }
    }

    async queryOne<T = any>(cypher: string, params?: Record<string, any>): Promise<T | null> {
        const results = await this.query<T>(cypher, params)
        return results[0] || null
    }
}

const globalForNeo4j = global as unknown as { neo4jClient?: Neo4jClient }

export function getNeo4jClient(): Neo4jClient {
    if (!globalForNeo4j.neo4jClient) {
        globalForNeo4j.neo4jClient = new Neo4jClient({
            uri: process.env.NEO4J_URI,
            username: process.env.NEO4J_USERNAME,
            password: process.env.NEO4J_PASSWORD,
        })
    }
    return globalForNeo4j.neo4jClient
}
