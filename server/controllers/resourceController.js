const Resource = require('../models/Resource');
const Category = require('../models/Category');

// ─────────────────────────────────────────────────────────────
// GET /api/resources
// Feature 4: search by text (regex fallback if no text index) + filter by category
// Supports: ?search=anxiety  ?category=<ObjectId or name>  ?tag=coping
// ─────────────────────────────────────────────────────────────
const getResources = async (req, res) => {
  try {
    const { category, search, tag } = req.query;
    let query = {};

    // ── Category filter: accept either ObjectId OR category name ──
    if (category) {
      // Check if it looks like a MongoDB ObjectId (24 hex chars)
      const isObjectId = /^[a-f\d]{24}$/i.test(category);
      if (isObjectId) {
        query.category = category;
      } else {
        // Lookup by name (case-insensitive)
        const cat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
        if (cat) query.category = cat._id;
        else query.category = null; // will return empty — category doesn't exist
      }
    }

    // ── Tag filter ──
    if (tag) {
      query.tags = { $in: [new RegExp(tag, 'i')] };
    }

    // ── Text search: try $text index first, fall back to regex ──
    let resources;
    if (search) {
      try {
        // Attempt MongoDB text search (requires the text index on title/description/tags)
        resources = await Resource.find(
          { ...query, $text: { $search: search } },
          { score: { $meta: 'textScore' } }
        )
          .sort({ score: { $meta: 'textScore' } })
          .populate('category', 'name')
          .populate('addedBy', 'name');
      } catch (_) {
        // Text index not yet created — fall back to case-insensitive regex across fields
        const searchRegex = new RegExp(search, 'i');
        resources = await Resource.find({
          ...query,
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { tags: searchRegex },
          ],
        })
          .populate('category', 'name')
          .populate('addedBy', 'name')
          .sort({ createdAt: -1 });
      }
    } else {
      resources = await Resource.find(query)
        .populate('category', 'name')
        .populate('addedBy', 'name')
        .sort({ createdAt: -1 });
    }

    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/resources  (admin only)
const createResource = async (req, res) => {
  try {
    const { title, description, url, category, tags } = req.body;
    if (!title || !description || !category)
      return res.status(400).json({ message: 'Title, description, and category are required.' });

    const resource = await Resource.create({
      title: title.trim(),
      description: description.trim(),
      url: url ? url.trim() : '',
      category,
      tags: Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim()).filter(Boolean),
      addedBy: req.user._id,
    });

    const populated = await resource.populate('category', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/resources/:id  (admin only)
const updateResource = async (req, res) => {
  try {
    const { title, description, url, category, tags } = req.body;
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      {
        title, description, url, category,
        tags: Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim()).filter(Boolean),
      },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/resources/:id  (admin only)
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/resources/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/resources/categories  (admin only)
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required.' });

    const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (exists) return res.status(400).json({ message: 'Category already exists.' });

    const category = await Category.create({ name: name.trim(), description: description?.trim() });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/resources/categories/:id  (admin only)
const deleteCategory = async (req, res) => {
  try {
    const inUse = await Resource.countDocuments({ category: req.params.id });
    if (inUse > 0)
      return res.status(400).json({ message: `Cannot delete: ${inUse} resource(s) use this category.` });
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getResources, createResource, updateResource, deleteResource, getCategories, createCategory, deleteCategory };