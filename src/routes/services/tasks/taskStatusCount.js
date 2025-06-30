const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { queryDatabase } = require('../../../services/dbQuery');
const APP_CONFIG = require('../../../../config')
router.use(authMiddleware);
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
    console.log("yes get Tasks")
    let newReq = JSON.stringify(req.user, null, 2);
    console.log("req is", newReq);

    newReq = JSON.parse(newReq);
    const student_id = newReq.userId;
    console.log("mentorid", student_id)
    try {
        const query = `SELECT 
        t.status,
        COUNT(*) AS count
        FROM tasks t
        JOIN student_tasks st ON t.id = st.task_id
        WHERE st.student_id = $1
        GROUP BY t.status;
        `;
        const values = [student_id];

        const result = await queryDatabase(query, values);
        const tasks = result;

        return res.json({
            message: 'fetched',
            result: tasks
        })
    } catch(error) {
        logger.warn('Invalid user', { student_id });
        res.status(401).json({ error: 'Invalid user' });
    }
})

module.exports = router

