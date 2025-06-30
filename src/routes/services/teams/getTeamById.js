
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { queryDatabase } = require('../../../services/dbQuery');
const APP_CONFIG = require('../../../../config')
router.use(authMiddleware);
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
    console.log("yes getting Team By ID")
    const { id } = req.query;

    console.log("team id", id)
    try {
        const query = `
        SELECT
    t.id AS team_id,
    t.name AS team_name,
    t.description AS team_description,
    t.createdat AS team_createdat,
    t.updatedat AS team_updatedat,
    p.name AS project_name,
    u_mentor.name AS mentor_name,
    json_agg(
        json_build_object(
            'student_id', st.student_id,
            'student_role', st.role,
            'student_name', u_student.name
        )
    ) AS students
FROM
    teams t
LEFT JOIN
    projects p 
    ON 
        CASE 
            WHEN t.projectassociation ~ '^[0-9a-fA-F-]{36}$' 
            THEN t.projectassociation::uuid 
            ELSE NULL 
        END = p.id
LEFT JOIN
    users u_mentor ON u_mentor.id = t.mentor_id
JOIN
    student_teams st ON st.team_id = t.id
LEFT JOIN
    users u_student ON u_student.id = st.student_id
WHERE
    t.id = $1
GROUP BY
    t.id, t.name, t.description, t.createdat, t.updatedat, p.name, u_mentor.name;

        `
        const values = [id];

        const result = await queryDatabase(query, values);
        const teams = result;
console.log("team by id is ", teams)
        return res.json({
            message: 'fetched',
            result: teams
        })
    } catch(error) {
        logger.warn('Invalid user', { id });
        res.status(401).json({ error: 'Invalid user' });
    }
})

module.exports = router

