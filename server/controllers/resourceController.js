const Resource = require('../models/Resource');
const Category = require('../models/Category');

// GET /api/resources
const getResources = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const resources = await Resource.find(query)
      .populate('category', 'name')
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/resources  (admin only)
const createResource = async (req, res) => {
  try {
    const { title, description, url, category, tags } = req.body;

    const resource = await Resource.create({
      title,
      description,
      url,
      category,
      tags: tags || [],
      addedBy: req.user._id,
    });

    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/resources/:id  (admin only)
const deleteResource = async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
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
    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getResources, createResource, deleteResource, getCategories, createCategory };