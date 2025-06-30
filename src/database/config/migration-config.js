const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const migrationConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'buildlabapp',
    
    // Migration specific settings - Use absolute paths to avoid circular loading
    migrations: [
        path.join(__dirname, '../migrations/1640000000000-CreateUsersTable.js'),
        path.join(__dirname, '../migrations/1640000000001-CreateProjectsTable.js'),
        path.join(__dirname, '../migrations/1640000000002-AddForeignKeyConstraints.js')
    ],
    migrationsTableName: 'migrations_history',
    
    // Connection pool settings for production
    extra: {
        max: 20, // Maximum connections in pool
        min: 2,  // Minimum connections in pool
        acquire: 60000, // Maximum time to get connection
        idle: 10000,    // Maximum idle time
        evict: 1000,    // Eviction run interval
        createTimeoutMillis: 30000,
        acquireTimeoutMillis: 60000,
        idleTimeoutMillis: 600000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
    },
    
    // Logging
    logging: process.env.NODE_ENV === 'development' ? 'all' : ['error', 'warn'],
    logger: 'advanced-console',
    
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    
    // Synchronization disabled for production safety
    synchronize: false,
    
    // Migration settings
    migrationsRun: false, // Don't auto-run migrations
    dropSchema: false,    // Never drop schema
};

const AppDataSource = new DataSource(migrationConfig);

// Alternative: Create DataSource with direct migration imports
const CreateUsersTable = require('../migrations/1640000000000-CreateUsersTable.js');
const CreateProjectsTable = require('../migrations/1640000000001-CreateProjectsTable.js');
const AddForeignKeyConstraints = require('../migrations/1640000000002-AddForeignKeyConstraints.js');

const AppDataSourceWithDirectImports = new DataSource({
    ...migrationConfig,
    migrations: [CreateUsersTable, CreateProjectsTable, AddForeignKeyConstraints]
});

module.exports = { AppDataSource: AppDataSourceWithDirectImports, migrationConfig };
