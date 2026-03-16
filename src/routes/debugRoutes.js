const { Router } = require('express');
const debugController = require('../controllers/debugController');

const router = Router();

router.get('/groups', debugController.listGroups);

module.exports = router;
