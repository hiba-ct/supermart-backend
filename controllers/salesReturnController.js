
const mongoose = require("mongoose");
const SalesReturn = require("../models/SalesReturn");
const Sale = require("../models/Sale");
const Product = require("../models/Product");

// 1. Create a sales return
const createSalesReturn = async (req, res) => {
  const { invoiceNumber, items, reason, refundMethod, notes } =
    req.body || {};

  if (
    !invoiceNumber ||
    !reason?.trim() ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invoice number, items and reason are required.",
    });
  }

  const userId = req.userId || req.user?.id || req.user?._id;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({
      success: false,
      message: "Valid authenticated user not found.",
    });
  }

  const allowedMethods = [
    "cash",
    "card",
    "upi",
    "bank transfer",
  ];

  if (!allowedMethods.includes(refundMethod)) {
    return res.status(400).json({
      success: false,
      message: "Invalid refund method.",
    });
  }

  const session = await mongoose.startSession();

  try {
    let createdReturn;

    await session.withTransaction(async () => {
      const sale = await Sale.findOne({
        invoiceNumber: invoiceNumber.trim(),
      }).session(session);

      if (!sale) {
        throw new Error("Original sale not found.");
      }

      // Aggregate repeated product IDs in the request.
      const requested = new Map();

      for (const item of items) {
        if (
          !mongoose.isValidObjectId(item.product) ||
          !Number.isSafeInteger(Number(item.quantity)) ||
          Number(item.quantity) < 1
        ) {
          throw new Error(
            "Each product needs a valid ID and positive whole-number quantity."
          );
        }

        const id = String(item.product);

        requested.set(
          id,
          (requested.get(id) || 0) + Number(item.quantity)
        );
      }

      // Aggregate original sold quantities and their values.
      const soldProducts = new Map();

      for (const item of sale.items) {
        const id = String(item.product);
        const existing = soldProducts.get(id) || {
          name: item.name,
          quantity: 0,
          price: Number(item.price),
        };

        existing.quantity += Number(item.quantity);
        soldProducts.set(id, existing);
      }

      const previousReturns = await SalesReturn.find({
        sale: sale._id,
        status: "Completed",
      }).session(session);

      const previouslyReturned = new Map();

      for (const record of previousReturns) {
        for (const item of record.items) {
          const id = String(item.product);

          previouslyReturned.set(
            id,
            (previouslyReturned.get(id) || 0) +
              Number(item.quantity)
          );
        }
      }

      const returnItems = [];
      let refundAmount = 0;

      for (const [id, quantity] of requested) {
        const sold = soldProducts.get(id);

        if (!sold) {
          throw new Error(
            "A selected product was not part of the original sale."
          );
        }

        const returned = previouslyReturned.get(id) || 0;
        const remaining = sold.quantity - returned;

        if (quantity > remaining) {
          throw new Error(
            `Only ${Math.max(0, remaining)} unit(s) remain returnable for ${sold.name}.`
          );
        }

        const subtotal = Number(
          (sold.price * quantity).toFixed(3)
        );

        returnItems.push({
          product: id,
          productName: sold.name,
          quantity,
          price: sold.price,
          subtotal,
          restock: true,
        });

        refundAmount += subtotal;
      }

      refundAmount = Number(refundAmount.toFixed(3));

      // Restock products and save the return atomically.
      
      // Restock products and save the return atomically.
      for (const item of returnItems) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.product },
          { $inc: { stock: item.quantity } },
          {
            new: true,
            session,
            runValidators: true
          }
        );

        if (!updatedProduct) {
          throw new Error(
            `Product ${item.productName} no longer exists.`
          );
        }
      }


      const [record] = await SalesReturn.create(
        [
          {
            returnNumber: `RET-${Date.now()}-${Math.floor(
              1000 + Math.random() * 9000
            )}`,
            sale: sale._id,
            invoiceNumber: sale.invoiceNumber,
            items: returnItems,
            reason: reason.trim(),
            refundAmount,
            refundMethod,
            status: "Completed",
            notes: notes?.trim() || "",
            createdBy: userId,
          },
        ],
        { session }
      );

      createdReturn = record;
    });

    return res.status(201).json({
      success: true,
      message: "Sales return processed successfully.",
      salesReturn: createdReturn,
    });
  } catch (error) {
    console.error("Create sales return error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create return.",
    });
  } finally {
    await session.endSession();
  }
};

// 2. Get all sales returns
const getSalesReturns = async (req, res) => {
  try {
    const returns = await SalesReturn.find()
      .populate("sale", "invoiceNumber total")
      .populate("items.product", "name sku")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: returns.length,
      salesReturns: returns,
    });
  } catch (error) {
    console.error("Get sales returns error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales returns.",
    });
  }
};

// 3. Get one sales return
const getSalesReturnById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid return ID.",
      });
    }

    const salesReturn = await SalesReturn.findById(req.params.id)
      .populate("sale", "invoiceNumber total")
      .populate("items.product", "name sku")
      .populate("createdBy", "name email");

    if (!salesReturn) {
      return res.status(404).json({
        success: false,
        message: "Sales return not found.",
      });
    }

    return res.status(200).json({
      success: true,
      salesReturn,
    });
  } catch (error) {
    console.error("Get sales return error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales return.",
    });
  }
};

// 4. Find original invoice and returnable products
const getSaleForReturn = async (req, res) => {
  try {
    const invoiceNumber = req.params.invoiceNumber?.trim();

    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: "Invoice number is required.",
      });
    }

    const sale = await Sale.findOne({ invoiceNumber }).lean();

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found. Check the invoice number.",
      });
    }

    const previousReturns = await SalesReturn.find({
      sale: sale._id,
      status: "Completed",
    }).lean();

    const returnedQuantities = new Map();

    for (const record of previousReturns) {
      for (const item of record.items) {
        const id = String(item.product);

        returnedQuantities.set(
          id,
          (returnedQuantities.get(id) || 0) +
            Number(item.quantity)
        );
      }
    }

    // Group duplicate product lines before calculating quantities.
    const grouped = new Map();

    for (const item of sale.items) {
      const id = String(item.product);
      const existing = grouped.get(id) || {
        product: id,
        productName: item.name,
        quantity: 0,
        price: Number(item.price),
      };

      existing.quantity += Number(item.quantity);
      grouped.set(id, existing);
    }

    const items = [...grouped.values()].map((item) => {
      const returnedQuantity =
        returnedQuantities.get(item.product) || 0;

      return {
        ...item,
        returnedQuantity,
        remainingQuantity: Math.max(
          0,
          item.quantity - returnedQuantity
        ),
      };
    });

    return res.status(200).json({
      success: true,
      sale: {
        _id: sale._id,
        invoiceNumber: sale.invoiceNumber,
        createdAt: sale.createdAt,
        total: sale.total,
        items,
      },
    });
  } catch (error) {
    console.error("Get sale for return error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load the original sale.",
    });
  }
};

module.exports = {
  createSalesReturn,
  getSalesReturns,
  getSalesReturnById,
  getSaleForReturn,
};
