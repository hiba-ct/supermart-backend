const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    // Supplier / company name
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    // Contact person
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },

    // Phone number
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // Email
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Address
    address: {
      type: String,
      trim: true,
      default: "",
    },

    // City
    city: {
      type: String,
      trim: true,
      default: "",
    },

    // Country
    country: {
      type: String,
      trim: true,
      default: "Oman",
    },

    // VAT / Tax number
    vatNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // Payment terms
    paymentTerms: {
      type: String,
      enum: [
        "Cash",
        "7 Days",
        "15 Days",
        "30 Days",
        "60 Days",
      ],
      default: "Cash",
    },

    // Supplier status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Additional notes
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Supplier",
  supplierSchema
);