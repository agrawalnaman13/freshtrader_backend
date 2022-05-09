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
  addSellerProduct,
  getSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  addProductUnit,
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
router.post("/addProductUnit", tokenAuthorisation, addProductUnit);
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
module.exports = router;
