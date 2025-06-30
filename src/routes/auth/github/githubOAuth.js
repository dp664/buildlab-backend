const express = require("express");
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const { queryDatabase } = require('../../../services/dbQuery');
const APP_CONFIG = require('../../../../config')
const axios = require("axios");
router.use(authMiddleware);

router.get("/", (req, res) => {
    console.log("oauth")
    const clientId = APP_CONFIG.GITHUB_CLIENT_ID;
    console.log("redirecting...")
    res.redirect(
        `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user`
    );
});

module.exports = router;
