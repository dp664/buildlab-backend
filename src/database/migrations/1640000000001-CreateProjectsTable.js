const { MigrationInterface, QueryRunner, Table, Index } = require("typeorm");

class CreateProjectsTable1640000000001 {
    async up(queryRunner) {
        try {
            console.log('Starting CreateProjectsTable migration...');
            
            // Create enum type for project status
            await queryRunner.query(`
                DO $$ BEGIN
                    CREATE TYPE projects_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);

            // Create projects table
            await queryRunner.createTable(
                new Table({
                    name: "projectsnew",
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
                            isNullable: false,
                            default: "''",
                            isUnique: true
                        },
                        {
                            name: "description",
                            type: "text",
                            isNullable: false,
                            default: "''"
                        },
                        {
                            name: "status",
                            type: "enum",
                            enum: ["pending", "in_progress", "completed", "cancelled", "on_hold"],
                            default: "'pending'",
                            isNullable: false
                        },
                        {
                            name: "start_date",
                            type: "date",
                            isNullable: false
                        },
                        {
                            name: "end_date",
                            type: "date",
                            isNullable: false
                        },
                        {
                            name: "created_by_id",
                            type: "uuid",
                            isNullable: false
                        },
                        {
                            name: "updated_by_id",
                            type: "uuid",
                            isNullable: false
                        },
                        {
                            name: "createdat",
                            type: "timestamp",
                            default: "CURRENT_DATE",
                            isNullable: false
                        },
                        {
                            name: "updatedat",
                            type: "timestamp",
                            default: "CURRENT_DATE",
                            isNullable: false
                        },
                        {
                            name: "techstack",
                            type: "text",
                            isArray: true,
                            default: "ARRAY[]::text[]",
                            isNullable: true
                        },
                        {
                            name: "skillsrequired",
                            type: "text",
                            isArray: true,
                            default: "ARRAY[]::text[]",
                            isNullable: true
                        },
                        {
                            name: "github_repo_url",
                            type: "text",
                            isNullable: true
                        },
                        {
                            name: "github_repo_name",
                            type: "text",
                            isNullable: false
                        }
                    ]
                }),
                true
            );

            // Create unique constraint for project name
            await queryRunner.createIndex("projectsnew", new Index({
                name: "projects_name_unique",
                columnNames: ["name"],
                isUnique: true
            }));

            console.log('CreateProjectsTable migration completed successfully');
        } catch (error) {
            console.error('Error in CreateProjectsTable migration:', error);
            throw error;
        }
    }

    async down(queryRunner) {
        try {
            console.log('Rolling back CreateProjectsTable migration...');
            
            await queryRunner.dropTable("projectsnew", true);
            await queryRunner.query(`DROP TYPE IF EXISTS projects_status_enum CASCADE;`);
            
            console.log('CreateProjectsTable migration rolled back successfully');
        } catch (error) {
            console.error('Error rolling back CreateProjectsTable migration:', error);
            throw error;
        }
    }
}

module.exports = CreateProjectsTable1640000000001;

