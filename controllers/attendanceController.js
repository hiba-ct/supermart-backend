
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

const getUserId = (req) =>
  req.userId || req.user?.id || req.user?._id;

const normalizeDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
};

const validTime = (value) =>
  value === "" ||
  (typeof value === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value));

// ==========================================
// GET DAILY ATTENDANCE
// GET /api/attendance?date=YYYY-MM-DD
// ==========================================

const getDailyAttendance = async (req, res) => {
  try {
    const date = normalizeDate(req.query.date);

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid date in YYYY-MM-DD format.",
      });
    }

    const attendance = await Attendance.find({
      attendanceDate: date,
    })
      .populate(
        "employee",
        "employeeId name department jobRole employmentStatus"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Get daily attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve attendance.",
    });
  }
};

// ==========================================
// CREATE OR UPDATE DAILY ATTENDANCE
// POST /api/attendance
// ==========================================

const markAttendance = async (req, res) => {
  try {
    const {
      employeeId,
      attendanceDate,
      status,
      checkIn = "",
      checkOut = "",
      notes = "",
    } = req.body;

    const userId = getUserId(req);
    const date = normalizeDate(attendanceDate);

    const allowedStatuses = [
      "Present",
      "Absent",
      "Late",
      "On Leave",
    ];

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Valid logged-in user information was not found.",
      });
    }

    if (
      !employeeId ||
      !mongoose.isValidObjectId(employeeId) ||
      !date ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Employee, valid date, and attendance status are required.",
      });
    }

    if (
      !validTime(checkIn) ||
      !validTime(checkOut) ||
      typeof notes !== "string" ||
      notes.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter valid times and notes of up to 500 characters.",
      });
    }

    if (
      (status === "Absent" || status === "On Leave") &&
      (checkIn || checkOut)
    ) {
      return res.status(400).json({
        success: false,
        message: "Check-in and check-out must be empty for Absent or On Leave.",
      });
    }

    if (checkIn && checkOut && checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: "Check-out must be later than check-in.",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    if (employee.employmentStatus !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Cannot mark attendance for an inactive employee.",
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      {
        employee: employee._id,
        attendanceDate: date,
      },
      {
        $set: {
          status,
          checkIn,
          checkOut,
          notes: notes.trim(),
          updatedBy: userId,
        },
        $setOnInsert: {
          employee: employee._id,
          attendanceDate: date,
          markedBy: userId,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Attendance saved successfully.",
      attendance,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A record already exists for this employee and date. Refresh and try again.",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save attendance.",
    });
  }
};

module.exports = {
  getDailyAttendance,
  markAttendance,
};
