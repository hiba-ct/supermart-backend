const Supplier = require("../models/Supplier");

// ======================================================
// GET ALL SUPPLIERS
// ======================================================

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: suppliers.length,
      suppliers,
    });
  } catch (error) {
    console.error(
      "Get suppliers error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// GET SINGLE SUPPLIER
// ======================================================

const getSupplierById = async (req, res) => {
  try {
    const supplier =
      await Supplier.findById(
        req.params.id
      );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      success: true,
      supplier,
    });
  } catch (error) {
    console.error(
      "Get supplier error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// CREATE SUPPLIER
// ======================================================

const createSupplier = async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      phone,
      email,
      address,
      city,
      country,
      vatNumber,
      paymentTerms,
      isActive,
      notes,
    } = req.body;

    // ----------------------------------------------
    // REQUIRED FIELDS
    // ----------------------------------------------

    if (
      !companyName ||
      !companyName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Company name is required",
      });
    }

    if (
      !contactPerson ||
      !contactPerson.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Contact person is required",
      });
    }

    if (
      !phone ||
      !phone.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number is required",
      });
    }

    // ----------------------------------------------
    // CHECK DUPLICATE COMPANY
    // ----------------------------------------------

    const existingSupplier =
      await Supplier.findOne({
        companyName:
          companyName.trim(),
      });

    if (existingSupplier) {
      return res.status(409).json({
        success: false,
        message:
          "Supplier already exists",
      });
    }

    // ----------------------------------------------
    // CREATE
    // ----------------------------------------------

    const supplier =
      await Supplier.create({
        companyName:
          companyName.trim(),

        contactPerson:
          contactPerson.trim(),

        phone:
          phone.trim(),

        email:
          email?.trim() || "",

        address:
          address?.trim() || "",

        city:
          city?.trim() || "",

        country:
          country?.trim() || "Oman",

        vatNumber:
          vatNumber?.trim() || "",

        paymentTerms:
          paymentTerms || "Cash",

        isActive:
          isActive !== undefined
            ? isActive
            : true,

        notes:
          notes?.trim() || "",
      });

    res.status(201).json({
      success: true,
      message:
        "Supplier created successfully",
      supplier,
    });

  } catch (error) {
    console.error(
      "Create supplier error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// UPDATE SUPPLIER
// ======================================================

const updateSupplier = async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      phone,
      email,
      address,
      city,
      country,
      vatNumber,
      paymentTerms,
      isActive,
      notes,
    } = req.body;

    // ----------------------------------------------
    // FIND SUPPLIER
    // ----------------------------------------------

    const supplier =
      await Supplier.findById(
        req.params.id
      );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // ----------------------------------------------
    // CHECK DUPLICATE COMPANY
    // ----------------------------------------------

    if (companyName) {
      const duplicate =
        await Supplier.findOne({
          companyName:
            companyName.trim(),

          _id: {
            $ne: req.params.id,
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "Another supplier with this company name already exists",
        });
      }

      supplier.companyName =
        companyName.trim();
    }

    // ----------------------------------------------
    // UPDATE FIELDS
    // ----------------------------------------------

    if (contactPerson !== undefined) {
      supplier.contactPerson =
        contactPerson.trim();
    }

    if (phone !== undefined) {
      supplier.phone =
        phone.trim();
    }

    if (email !== undefined) {
      supplier.email =
        email.trim();
    }

    if (address !== undefined) {
      supplier.address =
        address.trim();
    }

    if (city !== undefined) {
      supplier.city =
        city.trim();
    }

    if (country !== undefined) {
      supplier.country =
        country.trim();
    }

    if (vatNumber !== undefined) {
      supplier.vatNumber =
        vatNumber.trim();
    }

    if (paymentTerms !== undefined) {
      supplier.paymentTerms =
        paymentTerms;
    }

    if (isActive !== undefined) {
      supplier.isActive =
        isActive;
    }

    if (notes !== undefined) {
      supplier.notes =
        notes.trim();
    }

    // ----------------------------------------------
    // SAVE
    // ----------------------------------------------

    await supplier.save();

    res.status(200).json({
      success: true,
      message:
        "Supplier updated successfully",
      supplier,
    });

  } catch (error) {
    console.error(
      "Update supplier error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// DELETE SUPPLIER
// ======================================================

const deleteSupplier = async (req, res) => {
  try {
    const supplier =
      await Supplier.findById(
        req.params.id
      );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    await Supplier.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message:
        "Supplier deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete supplier error:",
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
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};