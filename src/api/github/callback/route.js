// // const APP_CONFIG = require("../../../../config");

// export async function GET(request) {
//     const { searchParams } = new URL(request.url);
//     const code = searchParams.get('code');
  
//     const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
//       method: 'POST',
//       headers: {
//         Accept: 'application/json',
//       },
//       body: new URLSearchParams({
//         client_id: process.env.BL_AUTH_GITHUB_CLIENT_ID,
//         client_secret: process.env.BL_AUTH_GITHUB_CLIENT_SECRET,
//         code,
//       }),
//     });
  
//     const tokenData = await tokenResponse.json();
//     const accessToken = tokenData.access_token;
  
//     // Redirect to frontend with token (for demonstration purposes)
//     return Response.redirect(`http://localhost:3000/project-create?token=${accessToken}`);
//   }
  

const express = require('express');
const router = express.Router();
const axios = require('axios');
const APP_CONFIG = require('../../../../config')
const getGitHubUser = require('../githubUserInfo/route')
const saveGithubUserInfo = require('../createUser.js/route')

router.get('/', async (req, res) => {
  console.log("getting callback........................")
  const code = req.query.code;
  const userId = req.query.state; 

  if (!code || !userId) {
    return res.status(400).send('Missing code or state');
  }

  try {
    console.log("code is ", code, userId)
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: APP_CONFIG.GITHUB_CLIENT_ID,
        client_secret: APP_CONFIG.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    let userInfo; 
    if(accessToken) userInfo = await getGitHubUser(accessToken)
    
      console.log("Accs-token", accessToken, userInfo)

    let createGithubUser = await saveGithubUserInfo(userInfo, userId, accessToken)

    console.log("created user", createGithubUser)

    res.redirect(`http://localhost:3000/collabrativetools`);
  } catch (err) {
    console.error('GitHub callback error:', err);
    res.status(500).json({ error: 'Failed to fetch access token' });
  }
});

module.exports = router;
