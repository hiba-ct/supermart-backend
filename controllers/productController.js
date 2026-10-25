
const Product = require("../models/Product");

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      barcode,
      category,
      brand,
      description,
      purchasePrice,
      sellingPrice,
      stock,
      lowStockThreshold,
      unit,
      expiryDate,
      supplier
    } = req.body;

    // Check required fields
    if (
      !name ||
      !sku ||
      !category ||
      purchasePrice === undefined ||
      sellingPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required product fields"
      });
    }

    // Check SKU uniqueness
    const existingSku = await Product.findOne({ sku });

    if (existingSku) {
      return res.status(409).json({
        success: false,
        message: "SKU already exists"
      });
    }

    // Create product
    const product = await Product.create({
      name,
      sku,
      barcode,
      category,
      brand,
      description,
      purchasePrice,
      sellingPrice,
      stock,
      lowStockThreshold,
      unit,
      expiryDate,
      supplier,
      createdBy: req.userId
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message
    });
  }
};

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products"
    });
  }
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("createdBy", "name email role");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Get product by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product"
    });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Update product and return the updated document
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message
    });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product"
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
