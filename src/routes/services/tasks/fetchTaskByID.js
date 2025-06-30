
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { queryDatabase } = require('../../../services/dbQuery');
const APP_CONFIG = require('../../../../config')
router.use(authMiddleware);

router.get('/', async (req, res) => {
    console.log("yes fetch task by ID")
    const { id } = req.query;

    try {
        console.log("id is ", id, req.query.id)
        const query = `
        SELECT 
    t.*, 
    (
        SELECT json_agg(
            json_build_object(
                'student_id', u.id, 
                'student_name', u.name
            )
        )
        FROM student_tasks st
        JOIN users u ON u.id = st.student_id
        WHERE st.task_id = t.id
    ) AS assigned_to,
    p.name AS project_name
FROM tasks t
JOIN projects p ON p.id = t.project_id
WHERE t.id = $1;

        `;
        const values = [id];

        const result = await queryDatabase(query, values);
        const task = result;
        console.log("task is",task)
        return res.json({
            message: 'fetched',
            task 
        })
    } catch (error) {
        logger.warn('Invalid user', { id });
        res.status(401).json({ error: 'Invalid user' });
    }
})

module.exports = router

