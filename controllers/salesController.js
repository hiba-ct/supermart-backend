
const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Product = require("../models/Product");

// Generate a unique invoice number
const generateInvoiceNumber = () => {
  return `INV-${Date.now()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;
};

// ==========================================
// CREATE SALE
// POST /api/sales
// ==========================================
const createSale = async (req, res) => {
  const stockChanges = [];
  let savedSale = null;

  try {
    const {
      items,
      tax = 0,
      paymentMethod = "cash",
      customerName = "",
      customerPhone = "",
    } = req.body;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Please login again",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one product",
      });
    }

    if (!["cash", "card", "upi"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const taxAmount = Number(tax);

    if (!Number.isFinite(taxAmount) || taxAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid tax amount",
      });
    }

    // Combine repeated products into one quantity
    const quantityMap = new Map();

    for (const item of items) {
      if (
        !item.product ||
        !mongoose.Types.ObjectId.isValid(item.product)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive whole number",
        });
      }

      const productId = String(item.product);

      quantityMap.set(
        productId,
        (quantityMap.get(productId) || 0) + quantity
      );
    }

    let subtotal = 0;
    const saleItems = [];

    // Validate products and calculate totals
    for (const [productId, quantity] of quantityMap) {
      const product = await Product.findById(productId);

      if (!product || product.isActive === false) {
        return res.status(404).json({
          success: false,
          message: "Product not found or inactive",
        });
      }

      const price = Number(product.sellingPrice);
      const costPrice = Number(product.purchasePrice);
      const stock = Number(product.stock || 0);

      if (
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(costPrice) ||
        costPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${product.name}`,
        });
      }

      if (stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${stock}`,
        });
      }

      const itemSubtotal = Number(
        (price * quantity).toFixed(3)
      );

      subtotal += itemSubtotal;

      saleItems.push({
        product: product._id,
        name: product.name,
        quantity,
        price,
        costPrice,
        subtotal: itemSubtotal,
      });
    }

    subtotal = Number(subtotal.toFixed(3));

    const total = Number(
      (subtotal + taxAmount).toFixed(3)
    );

    // Save sale with a unique invoice number.
    // Retry if MongoDB reports a duplicate invoice.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        savedSale = await Sale.create({
          invoiceNumber: generateInvoiceNumber(),
          items: saleItems,
          subtotal,
          tax: taxAmount,
          total,
          paymentMethod,
          customerName:
            String(customerName || "").trim() ||
            "Walk-in Customer",
          customerPhone: String(customerPhone || "").trim(),
          createdBy: req.userId,
        });

        break;
      } catch (error) {
        if (
          error.code === 11000 &&
          error.keyPattern?.invoiceNumber
        ) {
          continue;
        }

        throw error;
      }
    }

    if (!savedSale) {
      return res.status(503).json({
        success: false,
        message: "Could not generate invoice number. Please try again.",
      });
    }

    // Deduct stock only if sufficient stock remains
    for (const item of saleItems) {
    const updatedProduct = await Product.findOneAndUpdate(
  {
    _id: item.product,
    stock: { $gte: item.quantity },
    isActive: { $ne: false },
  },
  {
    $inc: { stock: -item.quantity },
  },
  {
    returnDocument: 'after',
    runValidators: true,
  }
);
      if (!updatedProduct) {
        // Roll back stock already deducted in this request
        for (const change of [...stockChanges].reverse()) {
          await Product.updateOne(
            { _id: change.productId },
            { $inc: { stock: change.quantity } }
          );
        }

        stockChanges.length = 0;

        await Sale.findByIdAndDelete(savedSale._id);
        savedSale = null;

        return res.status(409).json({
          success: false,
          message:
            `Stock changed for ${item.name}. Please refresh and try again.`,
        });
      }

      stockChanges.push({
        productId: item.product,
        quantity: item.quantity,
      });
    }

    const result = await Sale.findById(savedSale._id)
      .populate(
        "items.product",
        "name sku sellingPrice purchasePrice stock"
      )
      .populate("createdBy", "name email role");

    return res.status(201).json({
      success: true,
      message: "Sale created successfully",
      sale: result,
    });
  } catch (error) {
    console.error("Create sale error:", error);

    // Best-effort rollback on unexpected errors
    for (const change of [...stockChanges].reverse()) {
      await Product.updateOne(
        { _id: change.productId },
        { $inc: { stock: change.quantity } }
      ).catch((rollbackError) => {
        console.error("Stock rollback error:", rollbackError);
      });
    }

    if (savedSale) {
      await Sale.findByIdAndDelete(savedSale._id).catch(
        (cleanupError) => {
          console.error("Sale cleanup error:", cleanupError);
        }
      );
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// ==========================================
// GET ALL SALES
// GET /api/sales
// ==========================================
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("items.product", "name sku sellingPrice")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sales.length,
      sales,
    });
  } catch (error) {
    console.error("Get sales error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get sales",
    });
  }
};

// ==========================================
// GET SINGLE SALE
// GET /api/sales/:id
// ==========================================
const getSaleById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID",
      });
    }

    const sale = await Sale.findById(req.params.id)
      .populate("items.product", "name sku sellingPrice")
      .populate("createdBy", "name email role");

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    return res.status(200).json({
      success: true,
      sale,
    });
  } catch (error) {
    console.error("Get sale error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get sale",
    });
  }
};

// ==========================================
// DELETE SALE
// DELETE /api/sales/:id
// ==========================================
const deleteSale = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Please login again",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID",
      });
    }

    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    // Aggregate quantities in case a sale has repeated products
    const quantityMap = new Map();

    for (const item of sale.items) {
      if (!item.product) continue;

      const productId = String(item.product);

      quantityMap.set(
        productId,
        (quantityMap.get(productId) || 0) +
          Number(item.quantity || 0)
      );
    }

    // Check all products before restoring stock
    for (const productId of quantityMap.keys()) {
      const exists = await Product.exists({ _id: productId });

      if (!exists) {
        return res.status(409).json({
          success: false,
          message:
            `Product ${productId} no longer exists. Sale was not deleted.`,
        });
      }
    }

    const restoredProducts = [];

    try {
      for (const [productId, quantity] of quantityMap) {
        await Product.updateOne(
          { _id: productId },
          { $inc: { stock: quantity } }
        );

        restoredProducts.push({ productId, quantity });
      }

      await Sale.findByIdAndDelete(sale._id);
    } catch (error) {
      // Undo restorations if deletion fails
      for (const item of [...restoredProducts].reverse()) {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stock: -item.quantity } }
        ).catch((rollbackError) => {
          console.error("Delete rollback error:", rollbackError);
        });
      }

      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Sale deleted and stock restored",
    });
  } catch (error) {
    console.error("Delete sale error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete sale",
    });
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  deleteSale,
};
