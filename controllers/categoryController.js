const Category = require("../models/Category");

// ==========================================
// GET ALL CATEGORIES
// ==========================================

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error(
      "Get categories error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ==========================================
// GET SINGLE CATEGORY
// ==========================================

const getCategoryById = async (req, res) => {
  try {
    const category =
      await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error(
      "Get category error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ==========================================
// CREATE CATEGORY
// ==========================================

const createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      isActive,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const existingCategory =
      await Category.findOne({
        name: name.trim(),
      });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category =
      await Category.create({
        name: name.trim(),
        description:
          description?.trim() || "",
        image: image || "",
        isActive:
          isActive !== undefined
            ? isActive
            : true,
      });

    res.status(201).json({
      success: true,
      message:
        "Category created successfully",
      category,
    });
  } catch (error) {
    console.error(
      "Create category error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ==========================================
// UPDATE CATEGORY
// ==========================================

const updateCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      isActive,
    } = req.body;

    const category =
      await Category.findById(
        req.params.id
      );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name) {
      const duplicate =
        await Category.findOne({
          name: name.trim(),
          _id: {
            $ne: req.params.id,
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "Another category with this name already exists",
        });
      }

      category.name =
        name.trim();
    }

    if (description !== undefined) {
      category.description =
        description.trim();
    }

    if (image !== undefined) {
      category.image = image;
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message:
        "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error(
      "Update category error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ==========================================
// DELETE CATEGORY
// ==========================================

const deleteCategory = async (req, res) => {
  try {
    const category =
      await Category.findById(
        req.params.id
      );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await Category.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message:
        "Category deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete category error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};