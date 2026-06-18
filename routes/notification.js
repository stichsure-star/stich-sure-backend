const router = require('express').Router();

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  updateProgress,
} = require('../controller/notification');

const { authentication } = require('../middlewares/authentication');

router.get('/getAll', authentication, getNotifications);
router.get('/unread-count', authentication, getUnreadCount);
router.put('/read/:id', authentication, markAsRead);
router.put('/read-all', authentication, markAllAsRead);
router.post('/update-progress', updateProgress)

module.exports = router;