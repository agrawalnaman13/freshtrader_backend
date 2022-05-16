const express = require("express");
const mongoose = require("mongoose");
const {
  orderProduct,
} = require("../Controllers/BuyerController/orderController");

const router = express.Router();
router.post("/orderProduct", orderProduct);

module.exports = router;
