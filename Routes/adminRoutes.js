const express = require("express");
const mongoose = require("mongoose");
const {
  adminSignup,
  login,
  getAdminData,
  forgotPassword,
  verifyOTP,
  updatePassword,
  changePassword,
  updateProfile,
} = require("../Controllers/AdminController/authController");
const {
  getBuyerData,
  getBuyerList,
  changeBuyerStatus,
} = require("../Controllers/AdminController/buyerController");
const {
  getDashboardCount,
} = require("../Controllers/AdminController/dashboardController");
const {
  addVariety,
  getVariety,
  addUnit,
  getUnit,
  addProductType,
  getProductType,
  addProductUnit,
  getProductUnit,
} = require("../Controllers/AdminController/productController");
const {
  sellerSignup,
  getSellerData,
  getSellerList,
  changeSellerStatus,
} = require("../Controllers/AdminController/sellerController");
const {
  addSubscription,
  getSubscriptionDetail,
  getSubscriptionList,
  changeSubscriptionStatus,
} = require("../Controllers/AdminController/subscriptionController");
const {
  replySupport,
} = require("../Controllers/SellerController/supportController");
const {
  createAdminSellerImagePath,
  uploadAdminSellerImage,
} = require("../helpers/uploadAdminImages");
const {
  createProductImagePath,
  uploadProductImage,
} = require("../helpers/uploadProductImages");
const tokenAdminAuthorisation = require("../middleware/tokenAdminAuth");
const tokenAuthorisation = require("../middleware/tokenAuth");
const router = express.Router();
router.post(
  "/adminSignup",
  createAdminSellerImagePath,
  uploadAdminSellerImage.any(),
  adminSignup
);
router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.post("/verifyOTP", verifyOTP);
router.post("/updatePassword", updatePassword);
router.post("/changePassword", tokenAdminAuthorisation, changePassword);
router.post("/updateProfile", tokenAdminAuthorisation, updateProfile);
router.get("/getAdminData", tokenAdminAuthorisation, getAdminData);
router.post("/addVariety", addVariety);
router.post("/getVariety", tokenAuthorisation, getVariety);
router.post("/addUnit", tokenAuthorisation, addUnit);
router.post("/getUnit", getUnit);
router.post(
  "/addProductType",
  createProductImagePath,
  uploadProductImage.any(),
  addProductType
);
router.post("/getProductType", tokenAuthorisation, getProductType);
router.post("/addProductUnit", addProductUnit);
router.post("/getProductUnit", tokenAuthorisation, getProductUnit);
router.post(
  "/sellerSignup",
  tokenAdminAuthorisation,
  createAdminSellerImagePath,
  uploadAdminSellerImage.any(),
  sellerSignup
);
router.get("/getSellerData/:id", tokenAdminAuthorisation, getSellerData);
router.post("/getSellerList", tokenAdminAuthorisation, getSellerList);
router.get(
  "/changeSellerStatus/:id",
  tokenAdminAuthorisation,
  changeSellerStatus
);
router.get("/getBuyerData/:id", tokenAdminAuthorisation, getBuyerData);
router.post("/getBuyerList", tokenAdminAuthorisation, getBuyerList);
router.get(
  "/changeBuyerStatus/:id",
  tokenAdminAuthorisation,
  changeBuyerStatus
);
router.post("/addSubscription", tokenAdminAuthorisation, addSubscription);
router.post(
  "/getSubscriptionDetail",
  tokenAdminAuthorisation,
  getSubscriptionDetail
);
router.get(
  "/getSubscriptionList",
  tokenAdminAuthorisation,
  getSubscriptionList
);
router.get(
  "/changeSubscriptionStatus/:id",
  tokenAdminAuthorisation,
  changeSubscriptionStatus
);
router.get("/getDashboardCount", tokenAdminAuthorisation, getDashboardCount);
router.post("/replySupport", tokenAdminAuthorisation, replySupport);
module.exports = router;
