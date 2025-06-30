
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { queryDatabase } = require('../../../services/dbQuery');
const APP_CONFIG = require('../../../../config')
router.use(authMiddleware);
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
    console.log("yes getting Teams for student")
    let newReq = JSON.stringify(req.user, null, 2);
    newReq = JSON.parse(newReq);
    const student_id = newReq.userId;
    console.log("student_id", student_id)
    try {
        const query = `
        SELECT
    t.id AS team_id,
    t.name AS team_name,
    t.description AS team_description,
    p.name AS project_name,
    u.name AS mentor_name,
    st.role AS student_role
FROM
    student_teams st
JOIN
    teams t ON st.team_id = t.id
LEFT JOIN
    projects p ON 
    CASE 
        WHEN t.projectassociation ~ '^[0-9a-fA-F-]{36}$' THEN t.projectassociation::uuid 
        ELSE NULL 
    END = p.id
LEFT JOIN
    users u ON u.id = t.mentor_id
WHERE
    st.student_id = $1;

        `;
        const values = [student_id];

        const result = await queryDatabase(query, values);
        const teams = result;
console.log("teams are", teams)
        return res.json({
            message: 'fetched',
            result: teams
        })
    } catch(error) {
        logger.warn('Invalid user', { student_id });
        res.status(401).json({ error: 'Invalid user' });
    }
})

module.exports = router

