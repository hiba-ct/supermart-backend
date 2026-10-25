const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const StockTransaction = require("../models/StockTransaction");

// ======================================================
// GENERATE PURCHASE NUMBER
// ======================================================

const generatePurchaseNumber = async () => {
  const count = await Purchase.countDocuments();

  const number = count + 1;

  return `PO-${String(number).padStart(4, "0")}`;
};


// ======================================================
// GET ALL PURCHASES
// ======================================================

const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate(
        "supplier",
        "companyName contactPerson phone"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      purchases,
    });
  } catch (error) {
    console.error(
      "Get purchases error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// GET SINGLE PURCHASE
// ======================================================

const getPurchaseById = async (req, res) => {
  try {
    const purchase =
      await Purchase.findById(req.params.id)
        .populate(
          "supplier",
          "companyName contactPerson phone email"
        )
        .populate(
          "items.product",
          "name sku stock"
        );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    res.status(200).json({
      success: true,
      purchase,
    });
  } catch (error) {
    console.error(
      "Get purchase error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// CREATE PURCHASE
// ======================================================

const createPurchase = async (req, res) => {
  try {
    const {
      supplier,
      supplierName,
      purchaseDate,
      items,
      subtotal,
      tax,
      discount,
      totalAmount,
      paymentStatus,
      paymentMethod,
      notes,
    } = req.body;

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: "Supplier is required",
      });
    }

    if (
      !supplierName ||
      !supplierName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Supplier name is required",
      });
    }

    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Purchase must contain at least one product",
      });
    }

    // --------------------------------------------------
    // VALIDATE PRODUCTS
    // --------------------------------------------------

    for (const item of items) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message:
            "Every purchase item must have a product",
        });
      }

      if (
        !item.quantity ||
        Number(item.quantity) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product quantity must be greater than 0",
        });
      }

      if (
        item.costPrice === undefined ||
        Number(item.costPrice) < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product cost price is required",
        });
      }
    }

    // --------------------------------------------------
    // GENERATE PURCHASE NUMBER
    // --------------------------------------------------

    const purchaseNumber =
      await generatePurchaseNumber();

    // --------------------------------------------------
    // CREATE PURCHASE
    // --------------------------------------------------

    const purchase =
      await Purchase.create({
        purchaseNumber,

        supplier,

        supplierName:
          supplierName.trim(),

        purchaseDate:
          purchaseDate || new Date(),

        items,

        subtotal:
          Number(subtotal || 0),

        tax:
          Number(tax || 0),

        discount:
          Number(discount || 0),

        totalAmount:
          Number(totalAmount || 0),

        paymentStatus:
          paymentStatus || "Pending",

        paymentMethod:
          paymentMethod || "Cash",

        purchaseStatus:
          "Draft",

        notes:
          notes?.trim() || "",

        createdBy:
          req.userId || undefined,
      });

    res.status(201).json({
      success: true,
      message:
        "Purchase created successfully",
      purchase,
    });

  } catch (error) {
    console.error(
      "Create purchase error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// UPDATE PURCHASE
// ======================================================

const updatePurchase = async (req, res) => {
  try {
    const purchase =
      await Purchase.findById(
        req.params.id
      );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // Don't allow editing received purchase
    if (
      purchase.purchaseStatus ===
      "Received"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Received purchase cannot be edited",
      });
    }

    // Don't allow editing cancelled purchase
    if (
      purchase.purchaseStatus ===
      "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled purchase cannot be edited",
      });
    }

    const {
      supplier,
      supplierName,
      purchaseDate,
      items,
      subtotal,
      tax,
      discount,
      totalAmount,
      paymentStatus,
      paymentMethod,
      notes,
    } = req.body;

    if (
      items &&
      (!Array.isArray(items) ||
        items.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Purchase must contain at least one product",
      });
    }

    // Update fields only when provided

    if (supplier !== undefined) {
      purchase.supplier =
        supplier;
    }

    if (
      supplierName !== undefined
    ) {
      purchase.supplierName =
        supplierName.trim();
    }

    if (
      purchaseDate !== undefined
    ) {
      purchase.purchaseDate =
        purchaseDate;
    }

    if (items !== undefined) {
      purchase.items = items;
    }

    if (subtotal !== undefined) {
      purchase.subtotal =
        Number(subtotal);
    }

    if (tax !== undefined) {
      purchase.tax =
        Number(tax);
    }

    if (discount !== undefined) {
      purchase.discount =
        Number(discount);
    }

    if (
      totalAmount !== undefined
    ) {
      purchase.totalAmount =
        Number(totalAmount);
    }

    if (
      paymentStatus !== undefined
    ) {
      purchase.paymentStatus =
        paymentStatus;
    }

    if (
      paymentMethod !== undefined
    ) {
      purchase.paymentMethod =
        paymentMethod;
    }

    if (notes !== undefined) {
      purchase.notes =
        notes.trim();
    }

    await purchase.save();

    res.status(200).json({
      success: true,
      message:
        "Purchase updated successfully",
      purchase,
    });

  } catch (error) {
    console.error(
      "Update purchase error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// RECEIVE PURCHASE
// ======================================================

const receivePurchase = async (req, res) => {
  try {
    const purchase =
      await Purchase.findById(
        req.params.id
      );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // Already received
    if (
      purchase.purchaseStatus ===
      "Received"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Purchase has already been received",
      });
    }

    // Cannot receive cancelled
    if (
      purchase.purchaseStatus ===
      "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled purchase cannot be received",
      });
    }

    // --------------------------------------------------
    // UPDATE EACH PRODUCT STOCK
    // --------------------------------------------------

    for (const item of purchase.items) {
      const product =
        await Product.findById(
          item.product
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            `Product not found: ${item.productName}`,
        });
      }

      const previousStock =
        Number(product.stock || 0);

      const quantity =
        Number(item.quantity);

      const newStock =
        previousStock + quantity;

      // Update product stock
      product.stock =
        newStock;

      await product.save();

      // ------------------------------------------------
      // CREATE STOCK TRANSACTION
      // ------------------------------------------------

      await StockTransaction.create({
        product:
          product._id,

        type: "IN",

        quantity,

        previousStock,

        newStock,

        reason:
          "Purchase received",

        reference:
          purchase.purchaseNumber,

        performedBy:
          req.userId ||
          undefined,
      });
    }

    // --------------------------------------------------
    // UPDATE PURCHASE STATUS
    // --------------------------------------------------

    purchase.purchaseStatus =
      "Received";

    await purchase.save();

    res.status(200).json({
      success: true,
      message:
        "Purchase received and inventory updated successfully",
      purchase,
    });

  } catch (error) {
    console.error(
      "Receive purchase error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// CANCEL PURCHASE
// ======================================================

const cancelPurchase = async (req, res) => {
  try {
    const purchase =
      await Purchase.findById(
        req.params.id
      );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    if (
      purchase.purchaseStatus ===
      "Received"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Received purchase cannot be cancelled",
      });
    }

    if (
      purchase.purchaseStatus ===
      "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Purchase is already cancelled",
      });
    }

    purchase.purchaseStatus =
      "Cancelled";

    await purchase.save();

    res.status(200).json({
      success: true,
      message:
        "Purchase cancelled successfully",
      purchase,
    });

  } catch (error) {
    console.error(
      "Cancel purchase error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// DELETE PURCHASE
// ======================================================

const deletePurchase = async (req, res) => {
  try {
    const purchase =
      await Purchase.findById(
        req.params.id
      );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // Never delete received purchase
    if (
      purchase.purchaseStatus ===
      "Received"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Received purchase cannot be deleted",
      });
    }

    await Purchase.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message:
        "Purchase deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete purchase error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  receivePurchase,
  cancelPurchase,
  deletePurchase,
};