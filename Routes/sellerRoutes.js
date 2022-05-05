const express = require("express");
const mongoose = require("mongoose");
const { login } = require("../Controllers/wholesellerController");
const {
  createProductImagePath,
  uploadProductImage,
} = require("../helpers/uploadProductImages");
const router = express.Router();
router.post("/login", login);

module.exports = router;
