const express = require('express');
const router = express.Router();

const {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  getCategories,
  createCategory,
  deleteCategory,
  rateResource
} = require('../controllers/resourceController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// ─────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────
router.get('/', getResources);
router.get('/categories', getCategories);

// FR-15: RATE RESOURCE
router.post('/rate/:id', rateResource);

// ─────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────
router.post('/', protect, authorize('admin'), createResource);

router.put('/:id', protect, authorize('admin'), updateResource);

router.delete('/:id', protect, authorize('admin'), deleteResource);

router.post('/categories', protect, authorize('admin'), createCategory);

router.delete('/categories/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;