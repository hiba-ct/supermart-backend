
const mongoose = require("mongoose");

const salesReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        productName: {
          type: String,
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        subtotal: {
          type: Number,
          required: true,
          min: 0,
        },

        restock: {
          type: Boolean,
          default: true,
        },
      },
    ],

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    refundAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    refundMethod: {
      type: String,
      enum: ["cash", "card", "upi", "bank transfer"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Completed", "Cancelled"],
      default: "Completed",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalesReturn", salesReturnSchema);
