const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const logger = require('../../../utils/logger');
const { queryDatabase } = require('../../../services/dbQuery');
router.use(authMiddleware);

router.put('/', async (req, res) => {
    console.log("yes update name");

    const newReq = JSON.parse(JSON.stringify(req.user));
    const user_id = newReq.userId;

    try {
        const { newName } = req.body;
        console.log("req.body", req.body, newName)
        
        const query = `UPDATE users SET 
            name = $1
            WHERE id = $2
            RETURNING *;`;

        const values = [newName, user_id];
        const userResult = await queryDatabase(query, values);

       console.log("userResult", userResult);
        res.status(200).json({
            message: 'name updated successfully',
            updatedUser: userResult[0],
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating task' });
    }
});

module.exports = router;