const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../middleware/auth');
const logger = require('../../../../utils/logger');
const { queryDatabase } = require('../../../../services/dbQuery');

router.use(authMiddleware);

router.post('/', async (req, res) => {
    console.log("yes creating task comment");

    const newReq = JSON.parse(JSON.stringify(req.user));
    const user_id = newReq.userId;

    try {
        const { id, comment, parent_comment_id } = req.body;

        console.log("req.body comment", req.body);

        // Convert empty string or undefined to null
        const safeParentCommentId = parent_comment_id && parent_comment_id !== '' ? parent_comment_id : null;

        const query = `
            INSERT INTO task_comments (
                task_id,
                author_id,
                content,
                parent_comment_id
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const values = [id, user_id, comment, safeParentCommentId];
        const CommentResult = await queryDatabase(query, values);

        console.log("creating comment", CommentResult);

        res.status(200).json({
            message: 'Comment created successfully',
            comment: CommentResult[0],
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating task comment' });
    }
});

module.exports = router;
