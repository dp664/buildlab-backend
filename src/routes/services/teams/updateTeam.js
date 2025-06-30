const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { queryDatabase } = require('../../../services/dbQuery');
const APP_CONFIG = require('../../../../config');
const jwt = require('jsonwebtoken');

router.use(authMiddleware);

router.put('/', async (req, res) => {
  try {
    const decoded = jwt.verify(req.cookies.bl_auth, APP_CONFIG.BL_AUTH_SECRET_KEY);
    const user_id = decoded.userId;

    const { team_id, team_name, team_description, students, rolesData } = req.body.updates;

    if (!team_id || !team_name || !Array.isArray(students)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Update the team info
    const updateTeamQuery = `
      UPDATE teams
      SET name = $1, description = $2, updatedat = NOW()
      WHERE id = $3;
    `;
    await queryDatabase(updateTeamQuery, [team_name, team_description, team_id]);

    // 2. Delete existing student-team mappings
    const deleteStudentTeamsQuery = `
      DELETE FROM student_teams WHERE team_id = $1;
    `;
    await queryDatabase(deleteStudentTeamsQuery, [team_id]);

    // 3. Insert updated student-team-role mappings
    const insertStudentTeamQuery = `
      INSERT INTO student_teams (team_id, student_id, role)
      VALUES ($1, $2, $3);
    `;

    // const { teamLead, designer, developer, qaEngineer } = rolesData;

    for (const student of students) {
    //   let role = '';

    //   if (teamLead === studentId) {
    //     role = 'teamLead';
    //   } else if (designer === studentId) {
    //     role = 'designer';
    //   } else if (developer.includes(studentId)) {
    //     role = 'developer';
    //   } else if (qaEngineer.includes(studentId)) {
    //     role = 'qaEngineer';
    //   }
console.log("student id is ", student)
      await queryDatabase(insertStudentTeamQuery, [team_id, student.student_id, student.student_role || ""]) ;
    }

    return res.status(200).json({ message: 'Team updated successfully' });

  } catch (error) {
    console.error('Error updating team:', error);
    logger.warn('Invalid user or error updating team', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
