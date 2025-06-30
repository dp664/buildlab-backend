const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { queryDatabase } = require('../../../services/dbQuery');
router.use(authMiddleware);     

router.post('/', async (req, res) => {
    console.log("yes add task")
    let newReq = JSON.stringify(req.user, null, 2);
    console.log("req is", newReq);

    newReq = JSON.parse(newReq);
    const mentor_id = newReq.userId;
    console.log("mentorid", mentor_id)
    try {
        const { title, description, status, assignedMember, dueDate, priority, created_by, project_id } = req.body.taskData;
        console.log("req,body", req.body.taskData)
        const query = `
            INSERT INTO tasks (title, description, status, due_date, priority, created_by, project_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
        `;
        const values = [title, description, status, dueDate, priority, mentor_id, project_id];

        const taskResult = await queryDatabase(query, values);
console.log("taskResult", taskResult)
        const taskId = taskResult[0].id;

        const studentTaskInsertQuery = `
            INSERT INTO student_tasks (student_id, task_id)
            VALUES ($1, $2);
        `;

        for (const studentId of assignedMember) {
            await queryDatabase(studentTaskInsertQuery, [studentId, taskId]);
        }
        console.log("Task created successfully")
        res.status(201).json({ message: 'Task created successfully', taskId });

    } catch(error) {
        await queryDatabase('ROLLBACK'); // Roll back in case of an error
        console.error(error);
        res.status(500).json({ error: 'Error creating tak' });
    }
});
module.exports = router;