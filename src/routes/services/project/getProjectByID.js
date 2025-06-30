
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { queryDatabase } = require('../../../services/dbQuery');
const APP_CONFIG = require('../../../../config')
router.use(authMiddleware);
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
    console.log("yes getProjectByID")
    const decoded = jwt.verify(req.cookies.bl_auth, APP_CONFIG.BL_AUTH_SECRET_KEY);
    const { id } = req.query;
    let user_id = decoded.userId
    console.log("mentor", user_id, id)
     
    try {
        const query = `
        SELECT 
  p.id, 
  p.name, 
  p.description,
  p.status, 
  p.start_date,  
  p.end_date, 
  p.created_by_id, 
  p.createdat, 
  p.techstack, 
  p.skillsrequired, 
  p.github_repo_url, 
  p.github_repo_name,
  COALESCE(
    json_agg(
      json_build_object('id', u.id, 'name', u.name)
    ) FILTER (WHERE u.id IS NOT NULL), '[]'
  ) AS students
FROM projects p
LEFT JOIN student_projects sp ON sp.project_id = p.id
LEFT JOIN users u ON u.id = sp.student_id
WHERE p.id = $1
GROUP BY p.id;
        `;
        const values = [id];

        const result = await queryDatabase(query, values);
        const project = result;
// console.log("project are", project)
        return res.json({
            message: 'fetched',
            project: project
        })
    } catch(error) {
        logger.warn('Invalid user', { user_id });
        res.status(401).json({ error: 'Invalid user' });
    }
})

module.exports = router

