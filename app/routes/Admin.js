const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/AdminController');
const adminSecurity = require('../middleware/admin');
router.get('/users', adminSecurity, controller.getUsers);
router.post('/users/:id/unlock', adminSecurity, controller.unlockUser);

module.exports = router;
