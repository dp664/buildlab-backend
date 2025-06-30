const { MigrationInterface, QueryRunner, Table, Index } = require("typeorm");

class CreateUsersTable1640000000000 {
    async up(queryRunner) {
        try {
            console.log('Starting CreateUsersTable migration...');
            
            // Create enum type first
            await queryRunner.query(`
                DO $$ BEGIN
                    CREATE TYPE users_role_enum AS ENUM ('admin', 'mentor', 'student', 'member');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);

            // Enable uuid extension if not exists
            await queryRunner.query(`
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            `);

            // Create users table
            await queryRunner.createTable(
                new Table({
                    name: "users",
                    columns: [
                        {
                            name: "id",
                            type: "uuid",
                            isPrimary: true,
                            generationStrategy: "uuid",
                            default: "uuid_generate_v4()"
                        },
                        {
                            name: "name",
                            type: "varchar",
                            isNullable: false
                        },
                        {
                            name: "email",
                            type: "varchar",
                            isNullable: false,
                            isUnique: true
                        },
                        {
                            name: "passwordhash",
                            type: "varchar",
                            isNullable: false
                        },
                        {
                            name: "role",
                            type: "enum",
                            enum: ["admin", "mentor", "student", "member"],
                            default: "'member'",
                            isNullable: false
                        },
                        {
                            name: "createdat",
                            type: "timestamp",
                            default: "now()",
                            isNullable: false
                        },
                        {
                            name: "updatedat",
                            type: "timestamp",
                            default: "now()",
                            isNullable: false
                        },
                        {
                            name: "assigned_to",
                            type: "integer",
                            isArray: true,
                            isNullable: true
                        }
                    ]
                }),
                true
            );

            // Create indexes
            await queryRunner.createIndex("users", new Index({
                name: "users_email_key",
                columnNames: ["email"],
                isUnique: true
            }));

            console.log('CreateUsersTable migration completed successfully');
        } catch (error) {
            console.error('Error in CreateUsersTable migration:', error);
            throw error;
        }
    }

    async down(queryRunner) {
        try {
            console.log('Rolling back CreateUsersTable migration...');
            
            await queryRunner.dropTable("users", true);
            await queryRunner.query(`DROP TYPE IF EXISTS users_role_enum CASCADE;`);
            
            console.log('CreateUsersTable migration rolled back successfully');
        } catch (error) {
            console.error('Error rolling back CreateUsersTable migration:', error);
            throw error;
        }
    }
}

module.exports = CreateUsersTable1640000000000;
