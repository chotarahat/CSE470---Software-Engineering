const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  getAllCounselors,
  createCounselor,
  toggleAvailability,
  generateMFA,
  enableMFA,
  verifyMFALogin
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/generate-mfa',protect,generateMFA);
router.post('/enable-mfa',protect,enableMFA);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-mfa',verifyMFALogin);
router.get('/profile', protect, getProfile);
router.get('/counselors', protect, authorize('admin'), getAllCounselors);
router.post('/counselors', protect, authorize('admin'), createCounselor);
router.patch('/availability', protect, authorize('counselor'), toggleAvailability);

module.exports = router;