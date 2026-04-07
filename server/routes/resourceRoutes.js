const express = require('express');
const router = express.Router();
const {
  getResources,
  createResource,
  deleteResource,
  getCategories,
  createCategory,
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public — anyone can browse resources
router.get('/', getResources);
router.get('/categories', getCategories);

// Admin only
router.post('/', protect, authorize('admin'), createResource);
router.delete('/:id', protect, authorize('admin'), deleteResource);
router.post('/categories', protect, authorize('admin'), createCategory);

module.exports = router;