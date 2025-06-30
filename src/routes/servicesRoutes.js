const express = require('express');
const getInfo = require('./services/getInfo/getInfo')
const addProject = require('./services/project/addProject');

const router = express.Router();

router.use('/getinfo', getInfo);
router.use('/addproject', addProject);

module.exports = router;