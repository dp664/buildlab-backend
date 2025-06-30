

// router.post('/', async (req, res) => {
//     console.log("yes creating notification")
//     let newReq = JSON.stringify(req.user, null, 2);
//     console.log("req is", newReq);

//     newReq = JSON.parse(newReq);
//     const created_by = newReq.userId;
// console.log("req body ", req.body)
//     try {
//     const { user_id, type, content, is_read, studentsData, mentorData, url } = req.body.notificationData;

//         const query = `
//             INSERT INTO notifications (user_id, type, content, created_by, is_read, students_list, mentors_list, url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
//         `;

//         const values = [user_id, type, content, created_by, is_read, studentsData, mentorData, url];
//         const notificationResult = await queryDatabase(query, values);
//         res.status(201).json({ message: 'notification created successfully', notificationResult });
//     } catch(error) {
//         await queryDatabase('ROLLBACK');
//         console.error(error);
//         res.status(500).json({ error: 'Error creating notification' });
//     }
// });
// module.exports = router;

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const createNotification = require('./helpers/createNotHelper');

router.use(authMiddleware);

router.post('/', async (req, res) => {
    console.log("yes creating notification")
    let newReq = JSON.stringify(req.user, null, 2);

    newReq = JSON.parse(newReq);
    const created_by = newReq.userId;
    const { user_id, type, content, is_read, studentsData, mentorData, url } = req.body.notificationData;

    try {
        const notificationResult = await createNotification(
            user_id,
            type,
            content,
            created_by,
            is_read,
            studentsData,
            mentorData,
            url
        );

        res.status(201).json({ message: 'Notification created successfully', notificationResult });
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ error: 'Error creating notification' });
    }
});

module.exports = router;
