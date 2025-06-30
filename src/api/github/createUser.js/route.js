const { queryDatabase } = require('../../../services/dbQuery');

async function saveGithubUserInfo(data, userId, githubToken) {
  const { id, login, avatar_url, html_url, type, site_admin, public_repos, public_gists,
    followers, following, created_at, updated_at } = data;
console.log("creating user")
  await queryDatabase(`
    INSERT INTO github_users (
      user_id, github_id, github_user_name, avatar_url, html_url, type, site_admin,
      public_repos, public_gists, followers, following,
      created_at_github, updated_at_github, github_token
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11,
      $12, $13, $14
    )
    ON CONFLICT (github_id) DO UPDATE
    SET
      github_user_name = EXCLUDED.github_user_name,
      avatar_url = EXCLUDED.avatar_url,
      html_url = EXCLUDED.html_url,
      type = EXCLUDED.type,
      site_admin = EXCLUDED.site_admin,
      public_repos = EXCLUDED.public_repos,
      public_gists = EXCLUDED.public_gists,
      followers = EXCLUDED.followers,
      following = EXCLUDED.following,
      updated_at_github = EXCLUDED.updated_at_github,
      github_token = EXCLUDED.github_token,
      updated_at = NOW()
  `, [
    userId,
    id,
    login,
    avatar_url,
    html_url,
    type,
    site_admin,
    public_repos,
    public_gists,
    followers,
    following,
    created_at,
    updated_at,
    githubToken
  ]);
}

module.exports = saveGithubUserInfo;


// params: [
//     undefined, undefined,
//     'pd664',   undefined,
//     undefined, 'User',
//     undefined, undefined,
//     undefined, 2,
//     1,         undefined,
//     undefined, undefined
//   ],

// const express = require('express');
// const router = express.Router();
// const { queryDatabase }  = require('../../../services/dbQuery')

// router.post('/', async (req, res) => {
//   const { userId, githubToken } = req.body;

//   if (!userId || !githubToken) {
//     return res.status(400).json({ error: 'Missing userId or githubToken' });
//   }

//   try {
//     // Get GitHub user info from API
//     const githubRes = await fetch('https://api.github.com/user', {
//       headers: {
//         Authorization: `token ${githubToken}`,
//         Accept: 'application/vnd.github.v3+json',
//       },
//     });

//     const githubData = await githubRes.json();

//     if (!githubRes.ok) {
//       return res.status(githubRes.status).json({ error: githubData });
//     }

//     // Insert or update in the DB
//     await db.query(`
//       INSERT INTO github_users (
//         user_id, github_id, login, avatar_url, html_url, type, site_admin,
//         public_repos, public_gists, followers, following,
//         created_at_github, updated_at_github, github_token
//       ) VALUES (
//         $1, $2, $3, $4, $5, $6, $7,
//         $8, $9, $10, $11,
//         $12, $13, $14
//       )
//       ON CONFLICT (github_id) DO UPDATE
//       SET
//         login = EXCLUDED.login,
//         avatar_url = EXCLUDED.avatar_url,
//         html_url = EXCLUDED.html_url,
//         type = EXCLUDED.type,
//         site_admin = EXCLUDED.site_admin,
//         public_repos = EXCLUDED.public_repos,
//         public_gists = EXCLUDED.public_gists,
//         followers = EXCLUDED.followers,
//         following = EXCLUDED.following,
//         updated_at_github = EXCLUDED.updated_at_github,
//         github_token = EXCLUDED.github_token,
//         updated_at = NOW()
//     `, [
//       userId,
//       githubData.id,
//       githubData.login,
//       githubData.avatar_url,
//       githubData.html_url,
//       githubData.type,
//       githubData.site_admin,
//       githubData.public_repos,
//       githubData.public_gists,
//       githubData.followers,
//       githubData.following,
//       githubData.created_at,
//       githubData.updated_at,
//       githubToken
//     ]);

//     res.status(200).json({ message: 'GitHub user info saved successfully' });

//   } catch (err) {
//     console.error('Error saving GitHub user info:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// module.exports = router;
