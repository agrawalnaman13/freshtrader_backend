const express = require("express");
const mongoose = require("mongoose");
const {
  signup,
  login,
} = require("../Controllers/BuyerController/authController");
const {
  orderProduct,
} = require("../Controllers/BuyerController/orderController");
const tokenAuthorisationBuyer = require("../middleware/tokenBuyerAuth");

const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/orderProduct", tokenAuthorisationBuyer, orderProduct);

module.exports = router;
