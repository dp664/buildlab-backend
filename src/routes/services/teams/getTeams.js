
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { queryDatabase } = require('../../../services/dbQuery');
const APP_CONFIG = require('../../../../config')
router.use(authMiddleware);
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
    console.log("yes getting Teams")
    let newReq = JSON.stringify(req.user, null, 2);
    console.log("req is", newReq);

    newReq = JSON.parse(newReq);
    const mentor_id = newReq.userId;
    console.log("mentorid", mentor_id)
    try {
        const query = `
        SELECT
    t.id AS id,
    t.name AS name,
    t.createdat AS created_at,
    t.updatedat AS updated_at,
    t.mentor_id,
    t.description AS description,
    p.name AS project_name
FROM
    teams t
LEFT JOIN
    projects p
ON
    CASE 
      WHEN t.projectassociation IS NOT NULL AND t.projectassociation <> '' 
      THEN t.projectassociation::UUID = p.id 
      ELSE FALSE 
    END
WHERE
    t.mentor_id = $1;

        `;
        const values = [mentor_id];

        const result = await queryDatabase(query, values);
        const teams = result;

        return res.json({
            message: 'fetched',
            result: teams
        })
    } catch(error) {
        logger.warn('Invalid user', { mentor_id });
        res.status(401).json({ error: 'Invalid user' });
    }
})

module.exports = router

