const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const { queryDatabase } = require('../../../services/dbQuery');

// router.use(authMiddleware);

router.get('/', async (req, res) => {
    const { term } = req.query;
    console.log("fetching user for message", term)

    try {
        const userQuery = `SELECT user_id, name, email, is_online, role
             FROM messaging_users WHERE name ILIKE $1 OR email ILIKE $1
             LIMIT 10`

        const userValue = [`%${term}%`]
        const result = await queryDatabase(userQuery, userValue);

        console.log("user result is ", result)
        return res.json(result);
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;