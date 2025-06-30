const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { queryDatabase } = require('../../../services/dbQuery');
router.use(authMiddleware);

router.get('/', async (req, res) => {
    console.log("getting info")
    let newReq = JSON.stringify(req.user, null, 2);
    console.log("req is", newReq);

    newReq = JSON.parse(newReq);
    const mentor_id = newReq.userId;
    try {
        const query = 'SELECT name, email, id FROM users WHERE id = $1';
        const values = [mentor_id];

        const result = await queryDatabase(query, values);
        const user = result[0];

        return res.json({
            message: 'fetched',
            result: user
        })
    }
    catch {
        logger.warn('Invalid user', { mentor_id });
        res.status(401).json({ error: 'Invalid user' });
    }
})

module.exports = router;