const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { createGitHubRepo } = require('../../../../src/api/github/createRepo/route');
const { deleteGitHubRepo } = require('../../../../src/api/github/deleteRepo/route');
const { queryDatabase, getTransactionClient } = require('../../../services/dbQuery');
const { checkProjectExistence } = require('./projectExistannce');
const { checkRepoExists } = require('../../../../src/api/github/createRepo/checkRepoExists');

router.use(authMiddleware);

router.post('/', async (req, res) => {
    const user_id = req.user.userId;
    let client = null;
    let repoCreated = false;
    let repoName = null;
    
    try {
        const { name, description, status, end_date, createdById, teamMembers, techStack, skillsRequired, mentorData } = req.body.projectData;
        const start_date = req.body.start_date || new Date().toISOString().split('T')[0];
        const mentorId = mentorData || user_id;

        // Validate required fields
        if (!name || !description || !status || !end_date) {
            return res.status(400).json({ 
                error: 'Missing required project fields',
                details: 'Name, description, status, and end_date are required'
            });
        }

        // Validate team members array
        if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
            return res.status(400).json({ 
                error: 'Team members are required',
                details: 'At least one team member must be specified'
            });
        }

        console.log('Starting project creation process...');

        // Step 1: Check if project already exists
        const projectCheck = await checkProjectExistence(name, user_id);
        if (projectCheck.exists) {
            console.log('Project already exists');
            return res.status(409).json({ 
                error: 'Project already exists',
                details: projectCheck.message 
            });
        }

        // Step 2: Get GitHub token
        const tokenResult = await queryDatabase(
            'SELECT github_token, github_user_name FROM github_users WHERE user_id = $1', 
            [user_id]
        );

        if (!tokenResult || tokenResult.length === 0) {
            return res.status(400).json({ 
                error: 'GitHub account not connected',
                details: 'Please connect your GitHub account first'
            });
        }

        const { github_token, github_user_name } = tokenResult[0];

        if (!github_token) {
            return res.status(400).json({ 
                error: 'GitHub token not found',
                details: 'Please reconnect your GitHub account'
            });
        }

        // Step 3: Check if GitHub repo already exists
        const repoCheck = await checkRepoExists(github_user_name, name, github_token);
        if (repoCheck) {
            console.log('GitHub repository already exists');
            return res.status(409).json({ 
                error: 'GitHub repository already exists',
                details: `Repository '${name}' already exists in your GitHub account`
            });
        }

        console.log('All validations passed. Creating GitHub repository...');

        // Step 4: Create GitHub repository
        const repoResponse = await createGitHubRepo(name, description, github_token);
        
        // Check if the response is ok
        if (!repoResponse.ok) {
            const errorData = await repoResponse.json();
            console.error('GitHub repository creation failed:', errorData);
            
            return res.status(repoResponse.status).json({
                error: 'Failed to create GitHub repository',
                details: errorData.error || errorData.message || 'Unknown GitHub API error',
                validation_errors: errorData.details || null
            });
        }

        const repoData = await repoResponse.json();
        repoCreated = true;
        repoName = repoData.repoName;
        
        console.log('GitHub repository created successfully:', repoData.repoUrl);

        // Step 5: Start database transaction
        client = await getTransactionClient();

        try {
            // Insert project into database
            const projectQuery = `
               INSERT INTO projects 
                (name, description, status, start_date, end_date, created_by_id, updated_by_id, techstack, skillsrequired, github_repo_url, github_repo_name)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id;
            `;
            console.log("values are",  name, description, status, start_date, end_date, 
                user_id, user_id, techStack, skillsRequired, 
                repoData.repoUrl, repoData.repoName)
            const projectValues = [
                name, description, status, start_date, end_date, 
                user_id, user_id, techStack, skillsRequired, 
                repoData.repoUrl, repoData.repoName
            ];
            
            const projectResult = await queryDatabase(projectQuery, projectValues, client);
            
            if (!projectResult || projectResult.length === 0) {
                throw new Error('Failed to create project in database');
            }
            console.log("projectresult ", projectResult)
            const projectId = projectResult[0].id;
            console.log('Project inserted successfully with ID:', projectId);

            // Step 6: Create mentor-project relation (PASS CLIENT!)
            await queryDatabase(
                'INSERT INTO mentor_projects (project_id, mentor_id) VALUES ($1, $2)',
                [projectId, mentorId],
                client  // ← This is the key fix!
            );
            console.log('Mentor-project relation created');

            // Step 7: Create student-project relations (PASS CLIENT!)
            const studentInsertPromises = teamMembers.map((student) => {
                const studentId = student.id || student;
                if (!studentId) {
                    throw new Error('Invalid student ID in team members');
                }
                return queryDatabase(
                    'INSERT INTO student_projects (project_id, student_id) VALUES ($1, $2)',
                    [projectId, studentId],
                    client  // ← This is also the key fix!
                );
            });
            
            await Promise.all(studentInsertPromises);
            console.log('Student-project relations created');

            // Commit transaction
            await client.query('COMMIT');
            console.log('Transaction committed successfully');

            // Success response
            return res.status(201).json({
                success: true,
                message: 'Project created successfully',
                data: {
                    projectId,
                    repoUrl: repoData.repoUrl,
                    repoName: repoData.repoName
                }
            });

        } catch (dbError) {
            // Rollback database transaction
            await client.query('ROLLBACK');
            console.error('Database error, transaction rolled back:', dbError);
            throw dbError; // Re-throw to trigger cleanup
        } finally {
            // Always release the client
            if (client) {
                client.release();
            }
        }

    } catch (error) {
        console.error('Error in project creation:', error);

        // Cleanup: Delete GitHub repo if it was created but database failed
        if (repoCreated && repoName) {
            try {
                console.log('Attempting to cleanup GitHub repository...');
                const tokenResult = await queryDatabase(
                    'SELECT github_token, github_user_name FROM github_users WHERE user_id = $1', 
                    [user_id]
                );
                
                if (tokenResult && tokenResult.length > 0) {
                    const { github_token, github_user_name } = tokenResult[0];
                    if (github_token) {
                        await deleteGitHubRepo(github_user_name, repoName, github_token);
                        console.log('GitHub repository cleaned up successfully');
                    }
                }
            } catch (cleanupError) {
                console.error('Failed to cleanup GitHub repository:', cleanupError);
                // Don't throw cleanup error, just log it
            }
        }

        // Determine error status and message
        let statusCode = 500;
        let errorMessage = 'Internal server error';
        let errorDetails = error.message;

        if (error.message.includes('GitHub')) {
            statusCode = 502;
            errorMessage = 'GitHub service error';
        } else if (error.message.includes('database')) {
            statusCode = 500;
            errorMessage = 'Database error';
        } else if (error.message.includes('validation')) {
            statusCode = 400;
            errorMessage = 'Validation error';
        }

        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: errorDetails
        });
    }
});

module.exports = router;
// const express = require('express');
// const router = express.Router();
// const authMiddleware = require('../../../middleware/auth');
// const logger = require('../../../utils/logger');
// const { createGitHubRepo } = require('../../../../src/api/github/createRepo/route');
// const { deleteGitHubRepo } = require('../../../../src/api/github/deleteRepo/route');
// const { queryDatabase } = require('../../../services/dbQuery');
// const { checkProjectExistence } = require('./projectExistannce');
// const { checkRepoExists } = require('../../../../src/api/github/createRepo/checkRepoExists');
// router.use(authMiddleware);

// router.post('/', async (req, res) => {
//     const user_id = req.user.userId;
    
//     try {
//         const { name, description, status, end_date, createdById, teamMembers, techStack, skillsRequired, mentorData } = req.body.projectData;
//         const start_date = req.body.start_date || new Date().toISOString().split('T')[0];
//         const mentorId = mentorData || user_id;

//         if (!name || !description || !status || !end_date) {
//             return res.status(400).json({ error: 'Missing required project fields' });
//           }

//           try {
//             const projectCheck = await checkProjectExistence(name, user_id);
    
//             if (projectCheck.exists) {
//                 console.log('Project already exists');
//                 return res.status(400).json({ error: projectCheck.message });
//             }

//             const tokenResult = await queryDatabase('SELECT github_token, github_user_name FROM github_users WHERE user_id = $1', [user_id]);
//             const {github_token, github_user_name }= tokenResult[0];

//             const repoCheck = await checkRepoExists( github_user_name, name, github_token);
//             if (repoCheck) {
//                 console.log('Repo already exists');
//                 return res.status(400).json({ error: 'Repo already exists' });
//             }

//             console.log('repoCheck', repoCheck);

// //             const githubUserNameQuery = `SELECT github_user_name FROM github_users WHERE user_id = ANY($1);`;
// // console.log("teamMembers are", teamMembers)
// //             const githubUserNameResult = await queryDatabase(githubUserNameQuery, [teamMembers])

// //             console.log("github result", githubUserNameResult)

//             const repoResponse = await createGitHubRepo(name, description, github_token);
//             if (!repoResponse.ok) {
//                 const err = await repoResponse.json();
//                 throw new Error(err?.error || 'Failed to create GitHub repository');
//             }
//             console.log('GitHub repository created successfully');
//             const repoData = await repoResponse.json();
//             console.log('Inserting project into database', repoData.repoUrl, repoData);
//             const projectQuery = `
//                 INSERT INTO projects 
//                 (name, description, status, start_date, end_date, created_by_id, updated_by_id, techstack, skillsrequired, github_repo_url, github_repo_name)
//                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
//                 RETURNING id;
//             `;
//             console.log('Project data:', name, description, status, start_date, end_date, user_id, user_id, techStack, skillsRequired, repoData.repoUrl);
//             const projectValues = [name, description, status, start_date, end_date, user_id, user_id, techStack, skillsRequired, repoData.repoUrl, repoData.repoName];
//             const projectResult = await queryDatabase(projectQuery, projectValues);
//             console.log('Project inserted successfully:', projectResult);
//             const projectId = projectResult[0].id;
//             console.log('Project ID:', projectId);
    
//             // Step 3: Mentor relation
//             await queryDatabase(
//                 'INSERT INTO mentor_projects (project_id, mentor_id) VALUES ($1, $2)',
//                 [projectId, mentorId]
//             );
    
//             // Step 4: Team members
//             const studentInsertPromises = teamMembers.map((student) => {
//                 const studentId = student.id || student;
//                 return queryDatabase(
//                     'INSERT INTO student_projects (project_id, student_id) VALUES ($1, $2)',
//                     [projectId, studentId]
//                 );
//             });
//             await Promise.all(studentInsertPromises);
    
//             res.status(201).json({
//                 message: 'Project created successfully',
//                 projectId,
//                 repoUrl: repoData.repoUrl,
//             });

//           } catch(err) {
//             console.error('Error creating project:', err);
//           }

//     } catch (error) {
//         if (error.message.includes('Failed to create GitHub repository') === false && req.body.projectData?.name) {
//             try {
//                 const name = req.body.projectData.name;
//                 const tokenResult = await queryDatabase('SELECT github_token, github_user_name FROM github_users WHERE user_id = $1', [req.user.userId]);
//                 const {github_token, github_user_name }= tokenResult[0];
//                 console.log('GitHub token for cleanup:', github_token);
//                 if (github_token) {
//                     console.log('Deleting GitHub repo');
//                     await deleteGitHubRepo(github_user_name, name, github_token);
//                 }
//             } catch (cleanupError) {
//                 console.error('Failed to delete GitHub repo after rollback:', cleanupError);
//             }
//         }
//         await queryDatabase('ROLLBACK'); 
//         console.error('Error creating project:', error);
//         return res.status(500).json({ error: error.message });
//     }
// });

// module.exports = router;