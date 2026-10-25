const Product = require("../models/Product");
const StockTransaction = require("../models/StockTransaction");

// ======================================================
// GET INVENTORY
// ======================================================

const getInventory = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ name: 1 });

    const inventory = products.map(
      (product) => ({
        _id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        stock: product.stock || 0,
        lowStockThreshold:
          product.lowStockThreshold || 10,
        unit: product.unit || "piece",
        sellingPrice:
          product.sellingPrice || 0,

        status:
          (product.stock || 0) === 0
            ? "OUT_OF_STOCK"
            : (product.stock || 0) <=
                (product.lowStockThreshold || 10)
              ? "LOW_STOCK"
              : "IN_STOCK",
      })
    );

    res.status(200).json({
      success: true,
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    console.error(
      "Get inventory error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// GET LOW STOCK
// ======================================================

const getLowStock = async (req, res) => {
  try {
    const products =
      await Product.find({
        $expr: {
          $and: [
            {
              $gt: ["$stock", 0],
            },
            {
              $lte: [
                "$stock",
                "$lowStockThreshold",
              ],
            },
          ],
        },
      }).sort({ stock: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(
      "Get low stock error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// GET OUT OF STOCK
// ======================================================

const getOutOfStock = async (
  req,
  res
) => {
  try {
    const products =
      await Product.find({
        stock: {
          $lte: 0,
        },
      }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(
      "Get out of stock error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// ADJUST STOCK
// ======================================================

const adjustStock = async (
  req,
  res
) => {
  try {
    const {
      productId,
      type,
      quantity,
      reason,
      reference,
    } = req.body;

    // ----------------------------------------------
    // VALIDATION
    // ----------------------------------------------

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (
      !["IN", "OUT", "ADJUSTMENT"].includes(
        type
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stock transaction type",
      });
    }

    if (
      !quantity ||
      Number(quantity) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be greater than 0",
      });
    }

    // ----------------------------------------------
    // FIND PRODUCT
    // ----------------------------------------------

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const previousStock =
      Number(product.stock || 0);

    const stockQuantity =
      Number(quantity);

    let newStock;

    // ----------------------------------------------
    // STOCK IN
    // ----------------------------------------------

    if (type === "IN") {
      newStock =
        previousStock +
        stockQuantity;
    }

    // ----------------------------------------------
    // STOCK OUT
    // ----------------------------------------------

    else if (type === "OUT") {
      newStock =
        previousStock -
        stockQuantity;

      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message:
            "Insufficient stock",
        });
      }
    }

    // ----------------------------------------------
    // ADJUSTMENT
    // ----------------------------------------------

    else {
      newStock =
        stockQuantity;
    }

    // ----------------------------------------------
    // UPDATE PRODUCT
    // ----------------------------------------------

    product.stock = newStock;

    await product.save();

    // ----------------------------------------------
    // CREATE TRANSACTION
    // ----------------------------------------------

    const transaction =
      await StockTransaction.create({
        product: product._id,

        type,

        quantity:
          stockQuantity,

        previousStock,

        newStock,

        reason:
          reason || "",

        reference:
          reference || "",

        performedBy:
          req.userId || undefined,
      });

    // ----------------------------------------------
    // RESPONSE
    // ----------------------------------------------

    res.status(200).json({
      success: true,

      message:
        "Stock updated successfully",

      product: {
        id: product._id,
        name: product.name,
        stock: product.stock,
      },

      transaction,
    });
  } catch (error) {
    console.error(
      "Adjust stock error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// STOCK HISTORY
// ======================================================

const getStockHistory = async (
  req,
  res
) => {
  try {
    const {
      productId,
    } = req.params;

    const history =
      await StockTransaction.find({
        product: productId,
      })
        .populate(
          "product",
          "name sku"
        )
        .populate(
          "performedBy",
          "name email"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error(
      "Stock history error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


module.exports = {
  getInventory,
  getLowStock,
  getOutOfStock,
  adjustStock,
  getStockHistory,
};