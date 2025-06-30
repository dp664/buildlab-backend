const express = require('express');
const bcrypt = require('bcryptjs');
const { isEmailValid } = require('../../utils/email');
const { queryDatabase } = require('../../services/dbQuery');
const { sendAuthCookie } = require('../../services/cookieService');
const { checkEmailExists } = require('../../services/userVerifyService');

const logger = require('../../utils/logger');
const APP_CONFIG = require('../../../config');

const router = express.Router();

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  if (!isEmailValid(email)) {
    logger.error('Invalid email format', { email });
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const emailExists = await checkEmailExists(email);

    if (!emailExists) {
        logger.warn('Login attempt with non-existent email', { email });
        return res.status(401).json({ error: 'Email Not Found' });
    }

    const query = 'SELECT id, email, "passwordhash", name, role FROM users WHERE email = $1';
    const values = [email];

    const result = await queryDatabase(query, values);
    const user = result[0];

    if (user && await bcrypt.compare(password, user.passwordhash)) {
        const userResponse = sendAuthCookie(res, user);
      return res.json({
        message: 'Authenticated',
        user: userResponse,
        auth: userResponse.token
      });

    } else {
      logger.warn('Invalid credentials attempt', { email });
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    logger.error('Error during user signin', { 
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;