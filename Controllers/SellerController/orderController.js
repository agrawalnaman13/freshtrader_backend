const mongoose = require("mongoose");
const Order = require("../../Models/BuyerModels/orderSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const { success, error } = require("../../service_response/adminApiResponse");
exports.getOrders = async (req, res, next) => {
  try {
    const { sortBy, status } = req.body;
    console.log(req.body);
    const orders = await Order.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
          status: status,
        },
      },
      {
        $lookup: {
          localField: "buyer",
          foreignField: "_id",
          from: "buyers",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },
      {
        $sort:
          sortBy === 1
            ? { createdAt: 1 }
            : sortBy === 2
            ? { createdAt: -1 }
            : sortBy === 3
            ? { pick_up_time: 1 }
            : sortBy === 4
            ? { pick_up_time: -1 }
            : { createdAt: 1 },
      },
    ]);
    res
      .status(200)
      .json(success("Order fetched successfully", { orders }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getOrderDetails = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("buyer").lean();
    for (const product of order.product) {
      product.product = await SellerProduct.findById(product.productId)
        .populate(["variety", "type", "units"])
        .select(["category", "variety", "type", "units"]);
    }
    res
      .status(200)
      .json(
        success("Order detail fetched successfully", { order }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.changeOrderStatus = async (req, res, next) => {
  try {
    const { orderId, status } = req.body;
    console.log(req.body);
    if (!orderId) {
      return res
        .status(200)
        .json(error("Please provide order id", res.statusCode));
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(200).json(error("Invalid order id", res.statusCode));
    }
    if (!status) {
      return res
        .status(200)
        .json(error("Please provide status", res.statusCode));
    }
    order.status = status;
    await order.save();
    res
      .status(200)
      .json(
        success("Order status changed successfully", { order }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.sendCounterOffer = async (req, res, next) => {
  try {
    const { orderId, product, pick_up_time, pick_up_date, payment } = req.body;
    console.log(req.body);
    if (!orderId) {
      return res
        .status(200)
        .json(error("Please provide order id", res.statusCode));
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(200).json(error("Invalid order id", res.statusCode));
    }
    if (!product.length) {
      return res
        .status(200)
        .json(error("Please provide product", res.statusCode));
    }
    if (!pick_up_date) {
      return res
        .status(200)
        .json(error("Please provide pick up date", res.statusCode));
    }
    if (!pick_up_time) {
      return res
        .status(200)
        .json(error("Please provide pick up time", res.statusCode));
    }
    if (!payment) {
      return res
        .status(200)
        .json(error("Please provide payment type", res.statusCode));
    }
    order.product = product;
    order.pick_up_date = new Date(pick_up_date);
    order.pick_up_time = pick_up_time;
    order.payment = payment;
    order.status = "COUNTER";
    await order.save();
    res
      .status(200)
      .json(
        success("Order status changed successfully", { order }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.processOrder = async (req, res, next) => {
  try {
    const { orderId, product } = req.body;
    console.log(req.body);
    if (!orderId) {
      return res
        .status(200)
        .json(error("Please provide order id", res.statusCode));
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(200).json(error("Invalid order id", res.statusCode));
    }
    if (!product.length) {
      return res
        .status(200)
        .json(error("Please provide product", res.statusCode));
    }
    order.product = product;
    await order.save();
    res
      .status(200)
      .json(success("Order updated successfully", { order }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.changeOrderNotification = async (req, res, next) => {
  try {
    const {
      notify_new_order,
      notify_declined_offer,
      notify_confirmed_offer,
      notify_cancel_order,
    } = req.body;
    console.log(req.body);
    await Wholeseller.findByIdAndUpdate(req.seller._id, {
      notify_new_order,
      notify_declined_offer,
      notify_confirmed_offer,
      notify_cancel_order,
    });
    res
      .status(200)
      .json(success("Notification changed successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getOrderCount = async (req, res, next) => {
  try {
    const newOrderCount = await Order.find({
      seller: req.seller._id,
      status: "PENDING",
    }).countDocuments();
    const counterOrderCount = await Order.find({
      seller: req.seller._id,
      status: "COUNTER",
    }).countDocuments();
    const confirmedOrderCount = await Order.find({
      seller: req.seller._id,
      status: "CONFIRMED",
    }).countDocuments();
    res
      .status(200)
      .json(
        success(
          "Order count fetched successfully",
          { newOrderCount, counterOrderCount, confirmedOrderCount },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
