const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    brand: {
      type: String,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: 0
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0
    },

    unit: {
      type: String,
      enum: ["piece", "kg", "gram", "liter", "ml", "pack", "box"],
      default: "piece"
    },

    expiryDate: {
      type: Date
    },

    supplier: {
      type: String,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);