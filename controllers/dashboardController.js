
const Product = require("../models/Product");
const Sale = require("../models/Sale");
const SalesReturn = require("../models/SalesReturn");

// ============================================
// HELPERS
// ============================================
const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// ============================================
// 1. GET DASHBOARD STATISTICS
// ============================================
const getDashboardStats = async (req, res) => {
  try {
    const today = getStartOfToday();

    const [
      totalProducts,
      lowStockProducts,
      sales,
      totalRefundResult,
      todayRefundResult,
      recentSales,
    ] = await Promise.all([
      Product.countDocuments(),

      Product.find({ stock: { $lte: 10 } })
        .select("name sku stock")
        .limit(10),

      Sale.find().select("total createdAt"),

      SalesReturn.aggregate([
        { $match: { status: "Completed" } },
        {
          $group: {
            _id: null,
            totalRefunds: { $sum: "$refundAmount" },
            totalReturns: { $sum: 1 },
          },
        },
      ]),

      SalesReturn.aggregate([
        {
          $match: {
            status: "Completed",
            createdAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            todayRefunds: { $sum: "$refundAmount" },
            todayReturns: { $sum: 1 },
          },
        },
      ]),

      Sale.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "invoiceNumber customerName total paymentMethod createdAt"
        ),
    ]);

    const todaySales = sales
      .filter((sale) => new Date(sale.createdAt) >= today)
      .reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    const totalSales = sales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    );

    const totalRefunds = Number(
      totalRefundResult[0]?.totalRefunds || 0
    );

    const todayRefunds = Number(
      todayRefundResult[0]?.todayRefunds || 0
    );

    return res.status(200).json({
      success: true,

      stats: {
        totalProducts,
        lowStockCount: lowStockProducts.length,

        // Original sales totals
        todaySales,
        totalSales,
        totalTransactions: sales.length,

        // Return and net-sales totals
        todayRefunds,
        totalRefunds,
        todayNetSales: todaySales - todayRefunds,
        netSales: totalSales - totalRefunds,

        totalReturns: Number(
          totalRefundResult[0]?.totalReturns || 0
        ),
        todayReturns: Number(
          todayRefundResult[0]?.todayReturns || 0
        ),
      },

      lowStockProducts,
      recentSales,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics.",
    });
  }
};

// ============================================
// 2. GET SALES ANALYTICS
// ============================================
const getDashboardAnalytics = async (req, res) => {
  try {
    const startDate = getStartOfToday();
    startDate.setDate(startDate.getDate() - 6);

    const [
      dailySales,
      dailyReturns,
      bestSellingProducts,
      salesTotals,
      refundTotals,
      lowStockProducts,
    ] = await Promise.all([
      // Daily original sales
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            revenue: { $sum: "$total" },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Daily completed refunds
      SalesReturn.aggregate([
        {
          $match: {
            status: "Completed",
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            refunds: { $sum: "$refundAmount" },
            returns: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Best-selling products by units sold
      Sale.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            name: { $first: "$items.name" },
            quantitySold: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.subtotal" },
          },
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 5 },
      ]),

      // All-time original sales
      Sale.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            totalTransactions: { $sum: 1 },
          },
        },
      ]),

      // All-time completed refunds
      SalesReturn.aggregate([
        { $match: { status: "Completed" } },
        {
          $group: {
            _id: null,
            totalRefunds: { $sum: "$refundAmount" },
            totalReturns: { $sum: 1 },
          },
        },
      ]),

      Product.find({ stock: { $lte: 10 } })
        .select("name sku stock")
        .limit(10),
    ]);

    const salesSummary = salesTotals[0] || {};
    const refundSummary = refundTotals[0] || {};

    const totalRevenue = Number(salesSummary.totalRevenue || 0);
    const totalRefunds = Number(refundSummary.totalRefunds || 0);

    return res.status(200).json({
      success: true,

      dailySales,
      dailyReturns,

      bestSellingProducts,
      lowStockProducts,

      summary: {
        totalRevenue,
        totalRefunds,
        netRevenue: totalRevenue - totalRefunds,

        totalTransactions: Number(
          salesSummary.totalTransactions || 0
        ),
        totalReturns: Number(refundSummary.totalReturns || 0),
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard analytics.",
    });
  }
};

// ============================================
// 3. GET FINANCE SUMMARY
// ============================================
const getFinanceSummary = async (req, res) => {
  try {
    const today = getStartOfToday();

    const [
      overallTotals,
      todayTotals,
      overallRefundTotals,
      todayRefundTotals,
      paymentSummary,
      recentTransactions,
      totalProducts,
      lowStockCount,
    ] = await Promise.all([
      // All-time sales
      Sale.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            totalTransactions: { $sum: 1 },
          },
        },
      ]),

      // Today's sales
      Sale.aggregate([
        { $match: { createdAt: { $gte: today } } },
        {
          $group: {
            _id: null,
            todaySales: { $sum: "$total" },
            todayTransactions: { $sum: 1 },
          },
        },
      ]),

      // All-time refunds
      SalesReturn.aggregate([
        { $match: { status: "Completed" } },
        {
          $group: {
            _id: null,
            totalRefunds: { $sum: "$refundAmount" },
            totalReturns: { $sum: 1 },
          },
        },
      ]),

      // Today's refunds
      SalesReturn.aggregate([
        {
          $match: {
            status: "Completed",
            createdAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            todayRefunds: { $sum: "$refundAmount" },
            todayReturns: { $sum: 1 },
          },
        },
      ]),

      // Sales grouped by payment method
      Sale.aggregate([
        {
          $group: {
            _id: {
              $ifNull: ["$paymentMethod", "Unknown"],
            },
            totalAmount: { $sum: "$total" },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Most recent sales
      Sale.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "invoiceNumber customerName total paymentMethod createdAt"
        ),

      Product.countDocuments(),

      Product.countDocuments({
        stock: { $lte: 10 },
      }),
    ]);

    const overall = overallTotals[0] || {};
    const todaySummary = todayTotals[0] || {};
    const refunds = overallRefundTotals[0] || {};
    const todayRefunds = todayRefundTotals[0] || {};

    const totalSales = Number(overall.totalSales || 0);
    const totalRefundAmount = Number(refunds.totalRefunds || 0);
    const salesToday = Number(todaySummary.todaySales || 0);
    const refundsToday = Number(todayRefunds.todayRefunds || 0);

    return res.status(200).json({
      success: true,

      finance: {
        todaySales: salesToday,
        todayRefunds: refundsToday,
        todayNetSales: salesToday - refundsToday,

        todayTransactions: Number(
          todaySummary.todayTransactions || 0
        ),
        todayReturns: Number(todayRefunds.todayReturns || 0),

        totalSales,
        totalRefunds: totalRefundAmount,
        netSales: totalSales - totalRefundAmount,

        totalTransactions: Number(
          overall.totalTransactions || 0
        ),
        totalReturns: Number(refunds.totalReturns || 0),

        totalProducts,
        lowStockCount,
      },

      paymentSummary,
      recentTransactions,
    });
  } catch (error) {
    console.error("Finance summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load finance summary.",
    });
  }
};

// ============================================
// EXPORT CONTROLLERS
// ============================================
module.exports = {
  getDashboardStats,
  getDashboardAnalytics,
  getFinanceSummary,
};
