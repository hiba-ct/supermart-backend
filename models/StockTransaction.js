const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema(
  {
    // Product whose stock changed
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Type of stock movement
    type: {
      type: String,
      enum: [
        "IN",
        "OUT",
        "ADJUSTMENT",
      ],
      required: true,
    },

    // Quantity changed
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Stock before transaction
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },

    // Stock after transaction
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },

    // Why the stock changed
    reason: {
      type: String,
      trim: true,
      default: "",
    },

    // Optional reference
    reference: {
      type: String,
      trim: true,
      default: "",
    },

    // User who performed transaction
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "StockTransaction",
  stockTransactionSchema
);