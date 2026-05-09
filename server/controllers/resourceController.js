const Resource = require('../models/Resource');
const Category = require('../models/Category');

// ─────────────────────────────────────────────────────────────
// GET /api/resources
// ─────────────────────────────────────────────────────────────
const getResources = async (req, res) => {
  try {
    const { category, search, tag } = req.query;
    let query = {};

    if (category) {
      const isObjectId = /^[a-f\d]{24}$/i.test(category);
      if (isObjectId) {
        query.category = category;
      } else {
        const cat = await Category.findOne({
          name: { $regex: new RegExp(`^${category}$`, 'i') }
        });
        if (cat) query.category = cat._id;
        else query.category = null;
      }
    }

    if (tag) {
      query.tags = { $in: [new RegExp(tag, 'i')] };
    }

    let resources;

    if (search) {
      try {
        resources = await Resource.find(
          { ...query, $text: { $search: search } },
          { score: { $meta: 'textScore' } }
        )
          .sort({ score: { $meta: 'textScore' } })
          .populate('category', 'name')
          .populate('addedBy', 'name');
      } catch (_) {
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

    // Ensure all resources have consistent numeric rating values
    const sanitizedResources = resources.map(resource => {
      const sanitized = resource.toObject();
      // Ensure rating fields are always numbers, never null/undefined
      sanitized.ratingCount = Number(sanitized.ratingCount) || 0;
      sanitized.ratingSum = Number(sanitized.ratingSum) || 0;
      sanitized.averageRating = Number(sanitized.averageRating) || 0;
      return sanitized;
    });

    res.json(sanitizedResources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/resources
// ─────────────────────────────────────────────────────────────
const createResource = async (req, res) => {
  try {
    const { title, description, url, category, tags } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        message: 'Title, description, and category are required.'
      });
    }

    const resource = await Resource.create({
      title: title.trim(),
      description: description.trim(),
      url: url ? url.trim() : '',
      category,
      tags: Array.isArray(tags)
        ? tags
        : (tags || '').split(',').map(t => t.trim()).filter(Boolean),
      addedBy: req.user._id,
    });

    const populated = await resource.populate('category', 'name');
    res.status(201).json(populated);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/resources/:id
// ─────────────────────────────────────────────────────────────
const updateResource = async (req, res) => {
  try {
    const { title, description, url, category, tags } = req.body;

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        url,
        category,
        tags: Array.isArray(tags)
          ? tags
          : (tags || '').split(',').map(t => t.trim()).filter(Boolean),
      },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(resource);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/resources/:id
// ─────────────────────────────────────────────────────────────
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/resources/categories
// ─────────────────────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/resources/categories
// ─────────────────────────────────────────────────────────────
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const exists = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (exists) {
      return res.status(400).json({ message: 'Category already exists.' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description?.trim()
    });

    res.status(201).json(category);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/resources/categories/:id
// ─────────────────────────────────────────────────────────────
const deleteCategory = async (req, res) => {
  try {
    const inUse = await Resource.countDocuments({
      category: req.params.id
    });

    if (inUse > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${inUse} resource(s) use this category.`
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category deleted' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  FR-15: RATE RESOURCE (NEW)
// ─────────────────────────────────────────────────────────────
const rateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    // Validate rating input
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Data integrity check and correction for existing resources
    if (resource.ratingCount === undefined || resource.ratingCount === null) {
      resource.ratingCount = 0;
    }
    if (resource.ratingSum === undefined || resource.ratingSum === null) {
      resource.ratingSum = 0;
    }
    if (resource.averageRating === undefined || resource.averageRating === null) {
      resource.averageRating = 0;
    }

    // Update rating statistics
    resource.ratingCount += 1;
    resource.ratingSum += rating;

    // Calculate average rating with proper precision
    resource.averageRating = Number((resource.ratingSum / resource.ratingCount).toFixed(2));

    // Additional validation: ensure average is within valid range
    if (resource.averageRating < 1 || resource.averageRating > 5) {
      console.error(`Invalid average rating calculated: ${resource.averageRating} for resource ${id}`);
      // Reset to safe values
      resource.ratingCount = 1;
      resource.ratingSum = rating;
      resource.averageRating = rating;
    }

    await resource.save();

    console.log(`Rating submitted for resource ${id}: ${rating}, new average: ${resource.averageRating} (${resource.ratingCount} ratings)`);

    res.json({
      message: 'Rating submitted successfully',
      averageRating: resource.averageRating,
      ratingCount: resource.ratingCount,
      newRating: rating
    });

  } catch (error) {
    console.error('Rating submission error:', error);
    res.status(500).json({
      message: 'Failed to submit rating',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/resources/recalculate-ratings (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────
const recalculateRatings = async (req, res) => {
  try {
    const resources = await Resource.find({});
    let updatedCount = 0;
    let errorCount = 0;

    for (const resource of resources) {
      try {
        // Ensure all rating fields exist
        const ratingCount = resource.ratingCount || 0;
        const ratingSum = resource.ratingSum || 0;

        // Recalculate average rating
        const correctAverage = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : 0;

        // Only update if there's a discrepancy
        if (Math.abs((resource.averageRating || 0) - correctAverage) > 0.01) {
          resource.averageRating = correctAverage;
          await resource.save();
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error recalculating ratings for resource ${resource._id}:`, error);
        errorCount++;
      }
    }

    res.json({
      message: 'Rating recalculation completed',
      totalResources: resources.length,
      updatedResources: updatedCount,
      errors: errorCount
    });

  } catch (error) {
    console.error('Recalculation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/resources/heatmap
// Returns activity heatmap data (day vs hour) for dashboard visualization
// ─────────────────────────────────────────────────────────────
const getHeatmap = async (req, res) => {
  try {
    const Ticket = require('../models/Ticket');
    
    // Fetch all tickets to compute heatmap data
    const tickets = await Ticket.find({});
    
    // Initialize heatmap data structure
    const heatmapData = [];
    
    // Build heatmap by day of week (1-7) and hour of day (0-23)
    // Day mapping: 1=Sunday, 2=Monday, ..., 7=Saturday (ISO week day convention)
    for (let day = 1; day <= 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        let count = 0;
        
        // Count tickets created at this day/hour
        tickets.forEach(ticket => {
          const date = new Date(ticket.createdAt);
          // Convert JavaScript getDay() (0-6, 0=Sunday) to grid day (1-7, 1=Sunday)
          const ticketDay = date.getDay() + 1;
          const ticketHour = date.getHours();
          
          if (ticketDay === day && ticketHour === hour) {
            count++;
          }
        });
        
        heatmapData.push({
          day,
          hour,
          count,
          intensity: Math.min(count / 5, 1) // Normalize intensity
        });
      }
    }
    
    res.json(heatmapData);
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────
module.exports = {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  getCategories,
  createCategory,
  deleteCategory,
  rateResource,
  recalculateRatings,
  getHeatmap
};