const express = require('express');
const bcrypt = require('bcryptjs');
const { isEmailValid } = require('../../utils/email');
const { generateStoreId, generateUserId } = require('../../services/uuid');
const { queryDatabase } = require('../../services/dbQuery');
const logger = require('../../utils/logger');
// const APP_CONFIG = require('../config');
const { sendAuthCookie } = require('../../services/cookieService');
const { checkEmailExists } = require('../../services/userVerifyService');

const router = express.Router();

router.post('/', async (req, res) => {
  const { email, password, name  } = req.body.formData;
console.log("yes", email, password, name)
  if (!isEmailValid(email)) {
    logger.warn('Invalid email format', { email });
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Check if the email already exists
    const emailExists = await checkEmailExists(email);

    if (emailExists) {
        logger.warn('Signup attempt with existing email', { email });
        return res.status(409).json({ error: 'Email already exists' });
      }

    const hashedPassword = await bcrypt.hash(password, 10);
    // const store_id = generateStoreId();
    // const user_id = generateUserId();
    // logger.info('Generated user_id and store_id', { user_id, store_id });

    const query = `
      INSERT INTO users (email, "passwordhash", name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, role
    `;

    const values = [email, hashedPassword, name, 'mentor'];

    const result = await queryDatabase(query, values);

    const user = result[0];

    const messageQuery = `INSERT INTO messaging_users (user_id, name, email, role)
    VALUES ($1, $2, $3, $4) 
    RETURNING id;
    `;

    const messageValues = [user.id, name, email, 'mentor']

    const messageResult = await queryDatabase(messageQuery, messageValues)
    
console.log("yes created", user, messageResult)
    if (user) {
        const userResponse = sendAuthCookie(res, user);
        logger.info('User created and authenticated', res);
      res.json({
        message: 'User created and authenticated',
        user: userResponse,
        auth: userResponse.token
      });

    } else {
      res.status(500).json({ error: 'Error creating user' });
    }
  } catch (error) {
    queryDatabase('ROLLBACK')
    logger.error('Error during user signup', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;