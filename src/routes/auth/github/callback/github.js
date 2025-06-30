const express = require("express");
const router = express.Router();
const authMiddleware = require('../../../../middleware/auth');
const { queryDatabase } = require('../../../../services/dbQuery');
const APP_CONFIG = require('../../../../../config')
const axios = require("axios");
router.use(authMiddleware);

const USERS = {};

router.get("/", async (req, res) => {
  console.log("callback...")
  const code = req.query.code;
  console.log("code is", code)
  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: APP_CONFIG.GITHUB_CLIENT_ID,
        client_secret: APP_CONFIG.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );
console.log("token response", tokenResponse)
    const accessToken = tokenResponse.data.access_token;
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
console.log("user response", userResponse)
console.log("users", USERS)
    const { login } = userResponse.data; // GitHub username
    USERS[login] = { accessToken };
    // return
    res.redirect(`http://localhost:3000/team?user=${login}`);
  } catch (error) {
    res.status(500).json({ error: "GitHub authentication failed" });
  }
});




// const OAUTH_CONFIG = {
//   github: {
//     client_id: APP_CONFIG.GITHUB_CLIENT_ID,
//     client_secret: APP_CONFIG.GITHUB_CLIENT_SECRET,
//     token_url: "https://github.com/login/oauth/access_token",
//     user_info_url: "https://api.github.com/user",
//     redirect_uri: APP_CONFIG.GITHUB_CALLBACK_URL
//   }
// };

// // Generic OAuth Callback Handler
// router.post("/", async (req, res) => {
//     console.log("yes saving oAuth details")
//   const { provider } = 'github';
//   const { code } = req.body;
//   if (!code || !OAUTH_CONFIG[provider]) return res.status(400).send("Invalid request");
//   cons.log("everything is perfect!", code)
//   try {
//     console.log("trying")
//     // Exchange code for access_token
//     const tokenResponse = await axios.post(OAUTH_CONFIG[provider].token_url, {
//       client_id: OAUTH_CONFIG[provider].client_id,
//       client_secret: OAUTH_CONFIG[provider].client_secret,
//       code,
//       redirect_uri: OAUTH_CONFIG[provider].redirect_uri
//     }, { headers: { Accept: "application/json" } });

//     const access_token = tokenResponse.data.access_token;
//     console.log("access tojken is ", access_token)
//     if (!access_token) return res.status(400).send("Failed to get access token");

//     // Fetch user details from provider
//     let newReq = JSON.stringify(req.user, null, 2);
//     newReq = JSON.parse(newReq);
//     const user_id = newReq.userId;

//     if (!user_id) return res.status(401).json({ success: false, error: "Unauthorized: No valid session" });

//     const oAuthQuery = `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token)
//     VALUES ($1, $2, NULL, $3) 
//     ON CONFLICT (user_id, provider) 
//     DO UPDATE SET access_token = $3`

//     const oAuthValues = [user_id, "github", access_token]
// console.log("oAuthValue", oAuthValues)
//     const oAuthResult = await queryDatabase(oAuthQuery, oAuthValues)
// console.log("oAuth result", oAuthResult)
//     res.json({ success: true });

//   } catch (error) {
//     console.error(`${provider} OAuth Error:`, error);
//     res.status(500).send("Authentication failed");
//   }
// });

module.exports = router;
