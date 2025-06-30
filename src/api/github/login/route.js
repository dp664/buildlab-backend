// const APP_CONFIG = require('../../../../config');

// export async function GET(request) {
//     const params = new URLSearchParams({
//       client_id: process.env.GITHUB_CLIENT_ID,
//       scope: 'repo',
//     });
  
//     return Response.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
//   }
  

const express = require('express');
const router = express.Router();
const APP_CONFIG = require('../../../../config')

router.get('/', (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).send('Missing userId');
  }

  const params = new URLSearchParams({
    client_id: APP_CONFIG.GITHUB_CLIENT_ID,
    redirect_uri: 'http://localhost:5001/api/auth/github/callback',
    scope: 'read:user user:email repo delete_repo',
    // allow_signup: 'false',
    state: userId, // Pass the userId in the state param
  });


  const clientID = APP_CONFIG.GITHUB_CLIENT_ID;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  res.redirect(githubAuthUrl);

});
// https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&scope=repo,delete_repo

module.exports = router;
