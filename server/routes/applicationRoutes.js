const express = require('express');
const {
  getApplications,
  createApplication,
  getApplication,
  updateApplication,
  updateStatus,
  deleteApplication,
  getStats,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Every route below requires a valid JWT
router.use(protect);

router.route('/').get(getApplications).post(createApplication);

// Must come before '/:id' or "stats" would be treated as an id
router.get('/stats', getStats);

router.route('/:id').get(getApplication).put(updateApplication).delete(deleteApplication);
router.patch('/:id/status', updateStatus);

module.exports = router;
