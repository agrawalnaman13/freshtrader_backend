const express = require("express");
const mongoose = require("mongoose");
const {
  signup,
  login,
} = require("../Controllers/BuyerController/authController");
const {
  orderProduct,
  getSellers,
  getSellersProducts,
  addToCart,
  getMyCart,
  deleteFromCart,
  getOrders,
  getOrderDetails,
  getCartDetails,
  reorderProduct,
  getOrderCount,
  changeOrderNotification,
  getOrderNotification,
} = require("../Controllers/BuyerController/orderController");
const {
  getPallets,
} = require("../Controllers/BuyerController/palletsController");
const {
  buyPlan,
} = require("../Controllers/BuyerController/subscriptionController");
const {
  getSupport,
} = require("../Controllers/BuyerController/supportController");
const {
  getTransactions,
  downloadTransactionCSV,
} = require("../Controllers/BuyerController/transactionController");
const {
  changeOrderStatus,
} = require("../Controllers/SellerController/orderController");
const {
  updateTransactions,
} = require("../Controllers/SellerController/transactionController");
const tokenAuthorisationBuyer = require("../middleware/tokenBuyerAuth");

const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.get("/getSellers", tokenAuthorisationBuyer, getSellers);
router.post("/getSellersProducts", tokenAuthorisationBuyer, getSellersProducts);
router.post("/addToCart", tokenAuthorisationBuyer, addToCart);
router.get("/getMyCart", tokenAuthorisationBuyer, getMyCart);
router.get("/getCartDetails/:id", tokenAuthorisationBuyer, getCartDetails);
router.get("/deleteFromCart/:id", tokenAuthorisationBuyer, deleteFromCart);
router.post("/orderProduct", tokenAuthorisationBuyer, orderProduct);
router.post("/getOrders", tokenAuthorisationBuyer, getOrders);
router.get("/getOrderDetails/:id", tokenAuthorisationBuyer, getOrderDetails);
router.post("/changeOrderStatus", tokenAuthorisationBuyer, changeOrderStatus);
router.post("/reorderProduct", tokenAuthorisationBuyer, reorderProduct);
router.get("/getOrderCount", tokenAuthorisationBuyer, getOrderCount);
router.post("/getTransactions", tokenAuthorisationBuyer, getTransactions);
router.post(
  "/downloadTransactionCSV",
  tokenAuthorisationBuyer,
  downloadTransactionCSV
);
router.post("/updateTransactions", tokenAuthorisationBuyer, updateTransactions);
router.get("/getPallets", tokenAuthorisationBuyer, getPallets);
router.post(
  "/changeOrderNotification",
  tokenAuthorisationBuyer,
  changeOrderNotification
);
router.get(
  "/getOrderNotification",
  tokenAuthorisationBuyer,
  getOrderNotification
);
router.post("/buyPlan", tokenAuthorisationBuyer, buyPlan);
router.get("/getSupport", tokenAuthorisationBuyer, getSupport);
module.exports = router;
