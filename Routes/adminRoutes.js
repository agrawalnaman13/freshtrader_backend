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
} = require("../Controllers/adminController");
const {
  createProductImagePath,
  uploadProductImage,
} = require("../helpers/uploadProductImages");
const router = express.Router();
router.post("/addVariety", addVariety);
router.post("/getVariety", getVariety);
router.post("/addUnit", addUnit);
router.post("/getUnit", getUnit);
router.post(
  "/addProductType",
  createProductImagePath,
  uploadProductImage.any(),
  addProductType
);
router.post("/getProductType", getProductType);
router.post("/addProductUnit", addProductUnit);
router.post("/getProductUnit", getProductUnit);

module.exports = router;
