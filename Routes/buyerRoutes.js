const express = require("express");
const mongoose = require("mongoose");
const {
  signup,
  login,
  getBuyerData,
  updateAccountInformation,
  forgotPassword,
  verifyOTP,
  updatePassword,
  changePassword,
  updateProfile,
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
  checkProductAvailability,
} = require("../Controllers/BuyerController/orderController");
const {
  getPallets,
} = require("../Controllers/BuyerController/palletsController");
const {
  buyPlan,
  getMyPlan,
  getPlans,
  payment,
} = require("../Controllers/BuyerController/subscriptionController");
const {
  getSupport,
} = require("../Controllers/BuyerController/supportController");
const {
  getTransactions,
  downloadTransactionCSV,
  getBalance,
} = require("../Controllers/BuyerController/transactionController");
const {
  changeOrderStatus,
} = require("../Controllers/SellerController/orderController");
const {
  updateTransactions,
  getTransactionDetail,
} = require("../Controllers/SellerController/transactionController");
const tokenAuthorisationBuyer = require("../middleware/tokenBuyerAuth");

const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.post("/verifyOTP", verifyOTP);
router.post("/updatePassword", updatePassword);
router.get("/getBuyerData", tokenAuthorisationBuyer, getBuyerData);
router.post(
  "/updateAccountInformation",
  tokenAuthorisationBuyer,
  updateAccountInformation
);
router.post("/changePassword", tokenAuthorisationBuyer, changePassword);
router.post("/updateProfile", tokenAuthorisationBuyer, updateProfile);
router.post("/getSellers", tokenAuthorisationBuyer, getSellers);
router.post("/getSellersProducts", tokenAuthorisationBuyer, getSellersProducts);
router.post("/addToCart", tokenAuthorisationBuyer, addToCart);
router.post("/getMyCart", tokenAuthorisationBuyer, getMyCart);
router.get("/getCartDetails/:id", tokenAuthorisationBuyer, getCartDetails);
router.get("/deleteFromCart/:id", tokenAuthorisationBuyer, deleteFromCart);
router.post("/orderProduct", tokenAuthorisationBuyer, orderProduct);
router.post("/getOrders", tokenAuthorisationBuyer, getOrders);
router.get("/getOrderDetails/:id", tokenAuthorisationBuyer, getOrderDetails);
router.post("/changeOrderStatus", tokenAuthorisationBuyer, changeOrderStatus);
router.post("/reorderProduct", tokenAuthorisationBuyer, reorderProduct);
router.post(
  "/checkProductAvailability",
  tokenAuthorisationBuyer,
  checkProductAvailability
);
router.get("/getOrderCount", tokenAuthorisationBuyer, getOrderCount);
router.post("/getTransactions", tokenAuthorisationBuyer, getTransactions);
router.get(
  "/getTransactionDetail/:id",
  tokenAuthorisationBuyer,
  getTransactionDetail
);
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
router.get("/getPlans", tokenAuthorisationBuyer, getPlans);
router.get("/getMyPlan", tokenAuthorisationBuyer, getMyPlan);
router.get("/getSupport", tokenAuthorisationBuyer, getSupport);
router.get("/getBalance", tokenAuthorisationBuyer, getBalance);
router.post("/payment", tokenAuthorisationBuyer, payment);
module.exports = router;
