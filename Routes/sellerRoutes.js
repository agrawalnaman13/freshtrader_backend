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
} = require("../Controllers/SellerController/authController");
const {
  getBusinesses,
  addNewBusiness,
} = require("../Controllers/SellerController/inputBusinessSaleController");
const {
  getInventory,
} = require("../Controllers/SellerController/inventoryController");
const {
  getOrders,
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
} = require("../Controllers/SellerController/posLayoutController");
const {
  addSellerProduct,
  getSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  addProductUnit,
  addProductSupplier,
  searchSellerProduct,
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
} = require("../Controllers/SellerController/supplierIndexController");
const {
  createSellerImagePath,
  uploadSellerImage,
} = require("../helpers/uploadSellerImage");
const tokenAuthorisation = require("../middleware/tokenAuth");
const router = express.Router();
router.post("/login", login);
router.post("/addSellerProduct", tokenAuthorisation, addSellerProduct);
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
router.get("/getLayout", tokenAuthorisation, getLayout);
router.post("/addSupplier", tokenAuthorisation, addSupplier);
router.post("/updateSupplier", tokenAuthorisation, updateSupplier);
router.get("/getSuppliers", tokenAuthorisation, getSuppliers);
router.post("/searchSuppliers", tokenAuthorisation, searchSuppliers);
router.post("/getSuppliersProduct", tokenAuthorisation, getSuppliersProduct);
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
router.post("/getBusinesses", tokenAuthorisation, getBusinesses);
router.post("/addNewBusiness", tokenAuthorisation, addNewBusiness);
router.post("/getOrders", tokenAuthorisation, getOrders);
router.post("/searchBuyers", tokenAuthorisation, searchBuyers);
module.exports = router;
