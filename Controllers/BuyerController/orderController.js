const mongoose = require("mongoose");
const Unit = require("../../Models/AdminModels/unitSchema");
const Order = require("../../Models/BuyerModels/orderSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const { success, error } = require("../../service_response/adminApiResponse");
exports.orderProduct = async (req, res, next) => {
  try {
    const {
      seller,
      product,
      unit,
      quantity,
      pick_up_date,
      pick_up_time,
      notes,
      payment,
    } = req.body;
    console.log(req.body);
    if (!seller) {
      return res
        .status(200)
        .json(error("Please provide seller id", res.statusCode));
    }
    if (!quantity) {
      return res
        .status(200)
        .json(error("Please provide quantity", res.statusCode));
    }
    if (!product.length) {
      return res
        .status(200)
        .json(error("Please provide products", res.statusCode));
    }
    const sellerData = await Wholeseller.findById(seller);
    if (!sellerData) {
      return res.status(200).json(error("Invalid seller id", res.statusCode));
    }
    // const productData = await SellerProduct.findById(productId);
    // if (!productData) {
    //   return res.status(200).json(error("Invalid product id", res.statusCode));
    // }
    // const unitData = await Unit.findById(unit);
    // if (!unitData) {
    //   return res.status(200).json(error("Invalid unit id", res.statusCode));
    // }
    const order = await Order.create({
      buyer: req.buyer._id,
      seller,
      product,
      quantity,
      pick_up_date,
      pick_up_time,
      notes,
      payment,
    });
    res
      .status(200)
      .json(success("Order sent successfully", { order }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
