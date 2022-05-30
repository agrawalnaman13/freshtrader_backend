const express = require("express");
const mongoose = require("mongoose");
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
} = require("../Controllers/AdminController/sellerController");
const {
  createProductImagePath,
  uploadProductImage,
} = require("../helpers/uploadProductImages");
const tokenAuthorisation = require("../middleware/tokenAuth");
const router = express.Router();
router.post("/addVariety", addVariety);
router.post("/getVariety", tokenAuthorisation, getVariety);
router.post("/addUnit", addUnit);
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
router.post("/sellerSignup", sellerSignup);

module.exports = router;
