const express = require("express");
const mongoose = require("mongoose");
const {
  searchBuyers,
} = require("../Controllers/BuyerController/authController");
const {
  login,
  updateProfile,
  updateAccountInformation,
  updateSellerDocuments,
  updateSellerPassword,
  getSellerData,
  updateOrderSetting,
} = require("../Controllers/SellerController/authController");
const {
  getCustomerInfo,
  getCustomerTransactions,
  receivePayment,
} = require("../Controllers/SellerController/customerFilesController");
const {
  getEndOfDayReport,
} = require("../Controllers/SellerController/endOfDayController");
const {
  getBusinesses,
  addNewBusiness,
  getProductConsignments,
  processTransaction,
  getBusinessDetail,
  checkBusinessOverdue,
  undoTransaction,
} = require("../Controllers/SellerController/inputBusinessSaleController");
const {
  getInventory,
  resetInventory,
  resetCarryOver,
  adjustCarryOver,
  printInventory,
  updateOverselling,
} = require("../Controllers/SellerController/inventoryController");
const {
  getOrders,
  getOrderDetails,
  changeOrderStatus,
  sendCounterOffer,
  changeOrderNotification,
  processOrder,
  getOrderCount,
  getOrderNotification,
} = require("../Controllers/SellerController/orderController");
const {
  getPallets,
  addPalletsReceived,
  addPalletsTaken,
  addPalletsOnHand,
  getPalletsCount,
  returnPallets,
} = require("../Controllers/SellerController/palletsController");
const {
  getPartnerBuyers,
  changePartnerBuyer,
} = require("../Controllers/SellerController/partnerBuyerController");
const {
  editCategoryName,
  saveLayout,
  getLayout,
  getMyPOSProducts,
  moveProduct,
  changeVarietyStatus,
} = require("../Controllers/SellerController/posLayoutController");
const {
  addSellerProduct,
  getSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  addProductUnit,
  addProductSupplier,
  searchSellerProduct,
  getProductDetail,
  getMyVarietyList,
  getMyProductList,
  getCategoryList,
  getMyProductUnit,
  addMissingProduct,
  undoSellerProduct,
} = require("../Controllers/SellerController/productController");
const {
  createConsignment,
  addProductInConsignment,
  removeProductFromConsignment,
  changeConsignmentStatus,
  getConsignments,
  deleteConsignment,
  getConsignmentDetail,
} = require("../Controllers/SellerController/purchaseController");
const {
  addSalesman,
  getSalesman,
  deleteSalesman,
} = require("../Controllers/SellerController/salesmanController");
const {
  getSMCSReport,
  emailSMCS,
} = require("../Controllers/SellerController/smcsReportController");
const {
  addStaff,
  getStaff,
  getStaffDetail,
  updateStaff,
} = require("../Controllers/SellerController/staffController");
const {
  addStation,
  addDevice,
  getStations,
} = require("../Controllers/SellerController/stationsController");
const {
  addSupplier,
  updateSupplier,
  getSuppliers,
  deleteSupplier,
  searchSuppliers,
  getSuppliersProduct,
  getMyProducts,
} = require("../Controllers/SellerController/supplierIndexController");
const {
  createSupport,
  replySupport,
  changeSupportStatus,
  getSupport,
  deleteSupport,
  getSupportDetail,
} = require("../Controllers/SellerController/supportController");
const {
  getTransactions,
  updateTransactions,
  getTransactionDetail,
  changeTransactionStatus,
  deleteTransaction,
  changeAllTransactionStatus,
  downloadTransactionCSV,
  emailTransactionToBuyer,
  emailAllTransactionsToBuyers,
  printTransaction,
  printAllTransaction,
} = require("../Controllers/SellerController/transactionController");
const {
  createSellerImagePath,
  uploadSellerImage,
} = require("../helpers/uploadSellerImage");
const tokenAuthorisation = require("../middleware/tokenAuth");
const router = express.Router();
router.post("/login", login);
router.post("/addSellerProduct", tokenAuthorisation, addSellerProduct);
router.post("/undoSellerProduct", tokenAuthorisation, undoSellerProduct);
router.post(
  "/addMissingProduct",
  tokenAuthorisation,
  createSellerImagePath,
  uploadSellerImage.any(),
  addMissingProduct
);
router.post("/getSellerProduct", tokenAuthorisation, getSellerProduct);
router.post("/updateSellerProduct", tokenAuthorisation, updateSellerProduct);
router.post("/deleteSellerProduct", tokenAuthorisation, deleteSellerProduct);
router.post("/addProductSupplier", tokenAuthorisation, addProductSupplier);
router.post("/addProductUnit", tokenAuthorisation, addProductUnit);
router.post("/searchSellerProduct", tokenAuthorisation, searchSellerProduct);
router.post("/updateProfile", tokenAuthorisation, updateProfile);
router.post("/updateSellerPassword", tokenAuthorisation, updateSellerPassword);
router.post(
  "/updateAccountInformation",
  tokenAuthorisation,
  updateAccountInformation
);
router.post("/updateOrderSetting", tokenAuthorisation, updateOrderSetting);
router.post(
  "/updateSellerDocuments",
  tokenAuthorisation,
  createSellerImagePath,
  uploadSellerImage.any(),
  updateSellerDocuments
);
router.get("/getSellerData", tokenAuthorisation, getSellerData);
router.post("/addStation", tokenAuthorisation, addStation);
router.post("/addDevice", tokenAuthorisation, addDevice);
router.get("/getStations", tokenAuthorisation, getStations);
router.post("/addSalesman", tokenAuthorisation, addSalesman);
router.get("/getSalesman", tokenAuthorisation, getSalesman);
router.get("/deleteSalesman/:id", tokenAuthorisation, deleteSalesman);
router.post("/editCategoryName", tokenAuthorisation, editCategoryName);
router.post("/saveLayout", tokenAuthorisation, saveLayout);
router.post("/getLayout", tokenAuthorisation, getLayout);
router.post("/getMyPOSProducts", tokenAuthorisation, getMyPOSProducts);
router.post("/moveProduct", tokenAuthorisation, moveProduct);
router.post("/changeVarietyStatus", tokenAuthorisation, changeVarietyStatus);
router.post("/addSupplier", tokenAuthorisation, addSupplier);
router.post("/updateSupplier", tokenAuthorisation, updateSupplier);
router.get("/getSuppliers", tokenAuthorisation, getSuppliers);
router.post("/searchSuppliers", tokenAuthorisation, searchSuppliers);
router.post("/getSuppliersProduct", tokenAuthorisation, getSuppliersProduct);
router.post("/getMyProducts", tokenAuthorisation, getMyProducts);
router.get("/deleteSupplier/:id", tokenAuthorisation, deleteSupplier);
router.post("/getPallets", tokenAuthorisation, getPallets);
router.post("/addPalletsReceived", tokenAuthorisation, addPalletsReceived);
router.post("/addPalletsTaken", tokenAuthorisation, addPalletsTaken);
router.post("/addPalletsOnHand", tokenAuthorisation, addPalletsOnHand);
router.get("/getPalletsCount", tokenAuthorisation, getPalletsCount);
router.post("/returnPallets", tokenAuthorisation, returnPallets);
router.get("/getPartnerBuyers", tokenAuthorisation, getPartnerBuyers);
router.get("/changePartnerBuyer/:id", tokenAuthorisation, changePartnerBuyer);
router.post("/createConsignment", tokenAuthorisation, createConsignment);
router.post(
  "/addProductInConsignment",
  tokenAuthorisation,
  addProductInConsignment
);
router.post(
  "/removeProductFromConsignment",
  tokenAuthorisation,
  removeProductFromConsignment
);
router.post(
  "/changeConsignmentStatus",
  tokenAuthorisation,
  changeConsignmentStatus
);
router.post("/getConsignments", tokenAuthorisation, getConsignments);
router.get("/deleteConsignment/:id", tokenAuthorisation, deleteConsignment);
router.get(
  "/getConsignmentDetail/:id",
  tokenAuthorisation,
  getConsignmentDetail
);
router.post("/getInventory", tokenAuthorisation, getInventory);
router.post("/updateOverselling", tokenAuthorisation, updateOverselling);
router.get("/resetInventory", tokenAuthorisation, resetInventory);
router.get("/resetCarryOver", tokenAuthorisation, resetCarryOver);
router.post("/adjustCarryOver", tokenAuthorisation, adjustCarryOver);
router.post("/printInventory", tokenAuthorisation, printInventory);
router.post("/getBusinesses", tokenAuthorisation, getBusinesses);
router.get("/getBusinessDetail/:id", tokenAuthorisation, getBusinessDetail);
router.get(
  "/checkBusinessOverdue/:id",
  tokenAuthorisation,
  checkBusinessOverdue
);
router.post("/addNewBusiness", tokenAuthorisation, addNewBusiness);
router.post(
  "/getProductConsignments",
  tokenAuthorisation,
  getProductConsignments
);
router.get("/getProductDetail/:id", tokenAuthorisation, getProductDetail);
router.get("/getCategoryList", tokenAuthorisation, getCategoryList);
router.post("/getMyVarietyList", tokenAuthorisation, getMyVarietyList);
router.post("/getMyProductList", tokenAuthorisation, getMyProductList);
router.post("/getMyProductUnit", tokenAuthorisation, getMyProductUnit);
router.post("/processTransaction", tokenAuthorisation, processTransaction);
router.post("/undoTransaction", tokenAuthorisation, undoTransaction);
router.post("/getOrders", tokenAuthorisation, getOrders);
router.get("/getOrderDetails/:id", tokenAuthorisation, getOrderDetails);
router.post("/changeOrderStatus", tokenAuthorisation, changeOrderStatus);
router.post("/sendCounterOffer", tokenAuthorisation, sendCounterOffer);
router.get("/getOrderCount", tokenAuthorisation, getOrderCount);
router.post("/processOrder", tokenAuthorisation, processOrder);
router.get("/getOrderNotification", tokenAuthorisation, getOrderNotification);
router.post(
  "/changeOrderNotification",
  tokenAuthorisation,
  changeOrderNotification
);
router.post("/searchBuyers", tokenAuthorisation, searchBuyers);
router.post("/getTransactions", tokenAuthorisation, getTransactions);
router.post("/updateTransactions", tokenAuthorisation, updateTransactions);
router.get(
  "/getTransactionDetail/:id",
  tokenAuthorisation,
  getTransactionDetail
);
router.post(
  "/changeTransactionStatus",
  tokenAuthorisation,
  changeTransactionStatus
);
router.post("/deleteTransaction", tokenAuthorisation, deleteTransaction);
router.get(
  "/emailTransactionToBuyer/:id",
  tokenAuthorisation,
  emailTransactionToBuyer
);
router.post(
  "/emailAllTransactionsToBuyers",
  tokenAuthorisation,
  emailAllTransactionsToBuyers
);
router.post("/printTransaction", tokenAuthorisation, printTransaction);
router.post("/printAllTransaction", tokenAuthorisation, printAllTransaction);
router.get("/getCustomerInfo/:id", tokenAuthorisation, getCustomerInfo);
router.post(
  "/getCustomerTransactions",
  tokenAuthorisation,
  getCustomerTransactions
);
router.post(
  "/changeAllTransactionStatus",
  tokenAuthorisation,
  changeAllTransactionStatus
);
router.post(
  "/downloadTransactionCSV",
  tokenAuthorisation,
  downloadTransactionCSV
);
router.post("/receivePayment", tokenAuthorisation, receivePayment);
router.post("/getSMCSReport", tokenAuthorisation, getSMCSReport);
router.post("/emailSMCS", tokenAuthorisation, emailSMCS);
router.post("/getEndOfDayReport", tokenAuthorisation, getEndOfDayReport);
router.post("/addStaff", tokenAuthorisation, addStaff);
router.post("/getStaff", tokenAuthorisation, getStaff);
router.get("/getStaffDetail/:id", tokenAuthorisation, getStaffDetail);
router.post("/updateStaff", tokenAuthorisation, updateStaff);
router.post("/createSupport", tokenAuthorisation, createSupport);
router.post("/replySupport", tokenAuthorisation, replySupport);
router.get("/changeSupportStatus/:id", tokenAuthorisation, changeSupportStatus);
router.get("/getSupport", tokenAuthorisation, getSupport);
router.get("/getSupportDetail/:id", tokenAuthorisation, getSupportDetail);
module.exports = router;
