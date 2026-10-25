
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    attendanceDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "On Leave"],
      required: true,
    },

    checkIn: {
      type: String,
      default: "",
      trim: true,
    },

    checkOut: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// One attendance record per employee per normalized work date.
attendanceSchema.index(
  { employee: 1, attendanceDate: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
