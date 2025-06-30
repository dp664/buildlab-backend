const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { queryDatabase } = require('../../../services/dbQuery');
router.use(authMiddleware);

router.put('/', async (req, res) => {
    console.log("yes update task");

    const newReq = JSON.parse(JSON.stringify(req.user));
    const mentor_id = newReq.userId;

    try {
        const { id } = req.body;
        console.log("req.body", req.body)
        
        const { title, description, status, assigned_to, due_date, priority, created_by } = req.body.updatedTask;
        
        // 1. Update task details
        const query = `UPDATE tasks SET 
            title = $1,
            description = $2,
            status = $3,
            due_date = $4,
            priority = $5,
            updated_at = $6
            WHERE id = $7
            RETURNING *;`;

        const values = [title, description, status, due_date, priority, new Date(), id];
        const taskResult = await queryDatabase(query, values);

        await queryDatabase('DELETE FROM student_tasks WHERE task_id = $1;', [id]);

        for (const member of assigned_to) {
            await queryDatabase(
                'INSERT INTO student_tasks (task_id, student_id) VALUES ($1, $2);',
                [id, member.student_id]
            );
        }

        const fullTaskQuery = `
    SELECT 
        t.*, 
        (
            SELECT json_agg(json_build_object('student_id', u.id, 'student_name', u.name))
            FROM student_tasks st
            JOIN users u ON u.id = st.student_id
            WHERE st.task_id = t.id
        ) AS assigned_to
    FROM tasks t
    WHERE t.id = $1;
`;

        const fullTaskResult = await queryDatabase(fullTaskQuery, [id]);


        res.status(200).json({
            message: 'Task updated successfully',
            updatedTask: fullTaskResult[0],
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating task' });
    }
});

module.exports = router;