const express = require("express");
const mongoose = require("mongoose");
const {
  login,
  updateProfile,
  updateAccountInformation,
  updateSellerDocuments,
  updateSellerPassword,
  getSellerData,
} = require("../Controllers/SellerController/authController");
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
router.get("/deleteSupplier/:id", tokenAuthorisation, deleteSupplier);
router.post("/getPallets", tokenAuthorisation, getPallets);
router.post("/addPalletsReceived", tokenAuthorisation, addPalletsReceived);
router.post("/addPalletsTaken", tokenAuthorisation, addPalletsTaken);
router.post("/addPalletsOnHand", tokenAuthorisation, addPalletsOnHand);
router.get("/getPalletsCount", tokenAuthorisation, getPalletsCount);
router.post("/returnPallets", tokenAuthorisation, returnPallets);
router.get("/getPartnerBuyers", tokenAuthorisation, getPartnerBuyers);
router.get("/changePartnerBuyer/:id", tokenAuthorisation, changePartnerBuyer);
module.exports = router;
