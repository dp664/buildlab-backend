
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { queryDatabase } = require('../../../services/dbQuery');
const APP_CONFIG = require('../../../../config')
router.use(authMiddleware);
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
    console.log("yes get Tasks");

    let newReq = JSON.stringify(req.user, null, 2);
    console.log("req is", newReq);

    newReq = JSON.parse(newReq);
    const mentor_id = newReq.userId;
    console.log("mentorid", mentor_id);

    try {
        const query = `
            SELECT 
                t.id,
                t.title,
                t.description,
                t.due_date,
                t.status,
                t.priority,
                COUNT(st.student_id) AS assigned_student_count
            FROM tasks t
            LEFT JOIN student_tasks st ON t.id = st.task_id
            WHERE t.created_by = $1
            GROUP BY t.id;
        `;

        const values = [mentor_id];
        const result = await queryDatabase(query, values);
        // console.log("task result", result)
        return res.json({
            message: 'fetched',
            result: result
        });

    } catch (error) {
        logger.warn('Invalid user', { mentor_id });
        res.status(401).json({ error: 'Invalid user' });
    }
});


module.exports = router

