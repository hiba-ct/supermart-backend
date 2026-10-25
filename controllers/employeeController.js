
const Employee = require("../models/Employee");

// CREATE EMPLOYEE
const createEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      phone,
      department,
      jobRole,
      joiningDate
    } = req.body;

    if (
      !employeeId ||
      !name ||
      !department ||
      !jobRole ||
      !joiningDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required employee fields"
      });
    }

    const existingEmployee = await Employee.findOne({
      employeeId: employeeId.trim()
    });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists"
      });
    }

    const employee = await Employee.create({
      employeeId,
      name,
      email,
      phone,
      department,
      jobRole,
      joiningDate
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee
    });
  } catch (error) {
    console.error("Create employee error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create employee"
    });
  }
};

// GET ALL EMPLOYEES
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    console.error("Get employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees"
    });
  }
};

// GET ONE EMPLOYEE
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    return res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    console.error("Get employee error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee"
    });
  }
};

// UPDATE EMPLOYEE
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee
    });
  } catch (error) {
    console.error("Update employee error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update employee"
    });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee
};
