const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Connect MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const salesRoutes = require("./routes/salesRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const salesReturnRoutes = require("./routes/salesReturnRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use( "/api/categories",categoryRoutes);
app.use("/api/inventory",inventoryRoutes);
app.use("/api/suppliers",supplierRoutes);
app.use("/api/purchases",purchaseRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sales-returns", salesReturnRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);



const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'SuperMart API is running successfully'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

