
class AddForeignKeyConstraints1640000000002 {
    async up(queryRunner) {
        try {
            console.log('Starting AddForeignKeyConstraints migration...');
            
            // Check if users table exists and has data
            const usersExist = await queryRunner.hasTable("users");
            const projectsExist = await queryRunner.hasTable("projects");
            
            if (!usersExist || !projectsExist) {
                throw new Error('Required tables (users, projects) do not exist');
            }

            // Add foreign key constraints for projects table
            await queryRunner.query(`
                ALTER TABLE projects 
                ADD CONSTRAINT fk_projects_created_by 
                FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE RESTRICT;
            `);

            await queryRunner.query(`
                ALTER TABLE projects 
                ADD CONSTRAINT fk_projects_updated_by 
                FOREIGN KEY (updated_by_id) REFERENCES users(id) ON DELETE RESTRICT;
            `);

            // Create indexes for better performance
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS idx_projects_created_by_id ON projects(created_by_id);
            `);

            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS idx_projects_updated_by_id ON projects(updated_by_id);
            `);

            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
            `);

            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);
            `);

            console.log('AddForeignKeyConstraints migration completed successfully');
        } catch (error) {
            console.error('Error in AddForeignKeyConstraints migration:', error);
            throw error;
        }
    }

    async down(queryRunner) {
        try {
            console.log('Rolling back AddForeignKeyConstraints migration...');
            
            // Drop foreign keys
            await queryRunner.query(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_created_by;`);
            await queryRunner.query(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_updated_by;`);
            
            // Drop indexes
            await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_created_by_id;`);
            await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_updated_by_id;`);
            await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_status;`);
            await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_dates;`);
            
            console.log('AddForeignKeyConstraints migration rolled back successfully');
        } catch (error) {
            console.error('Error rolling back AddForeignKeyConstraints migration:', error);
            throw error;
        }
    }
}

module.exports = AddForeignKeyConstraints1640000000002;
