const mongoose = require("mongoose");
const Order = require("../../Models/BuyerModels/orderSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const SellerStation = require("../../Models/SellerModels/sellerStationSchema");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const { sendNotification } = require("./notificationController");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const sendMail = require("../../services/mail");
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
    const order = await Order.findById(orderId).populate(["seller", "buyer"]);
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
    if (status === "CONFIRMED") {
      if (order.buyer.notify_order_confirmation && order.buyer.deviceId) {
        await sendNotification(
          "Confirm",
          order.seller.business_trading_name,
          {
            orderId: String(order._id),
            type: "Confirm",
          },
          order.buyer.deviceId
        );
      }
    } else if (status === "CANCELED") {
      if (order.buyer.notify_order_cancelation && order.buyer.deviceId) {
        await sendNotification(
          "Decline",
          order.seller.business_trading_name,
          {
            orderId: String(order._id),
            type: "Decline",
          },
          order.buyer.deviceId
        );
      }
    }
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
    const order = await Order.findById(orderId).populate(["buyer", "seller"]);
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
    if (order.buyer.notify_counter_order && order.buyer.deviceId) {
      await sendNotification(
        "Counter",
        order.seller.business_trading_name,
        {
          orderId: String(order._id),
          type: "Counter",
        },
        order.buyer.deviceId
      );
    }
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

exports.getOrderNotification = async (req, res, next) => {
  try {
    const notification = await Wholeseller.findById(req.seller._id).select([
      "notify_new_order",
      "notify_declined_offer",
      "notify_confirmed_offer",
      "notify_cancel_order",
    ]);
    res
      .status(200)
      .json(
        success(
          "Notification fetched successfully",
          { notification },
          res.statusCode
        )
      );
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

exports.printOrder = async (req, res, next) => {
  try {
    const { orderId, stationId } = req.body;
    console.log(req.body);
    if (!orderId) {
      return res
        .status(200)
        .json(error("Please provide order Id", res.statusCode));
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(200).json(error("Invalid order Id", res.statusCode));
    }
    if (!stationId) {
      return res
        .status(200)
        .json(error("Please provide station Id", res.statusCode));
    }
    const station = await SellerStation.findById(stationId);
    if (!station) {
      return res.status(200).json(error("Invalid station Id", res.statusCode));
    }
    if (!station.a4_printer.email && !station.a4_printer.local) {
      return res
        .status(200)
        .json(error("No A4 Printer added in selected station", res.statusCode));
    }
    for (const product of order.product) {
      product.product = await SellerProduct.findById(product.productId)
        .populate(["variety", "type", "units"])
        .select(["category", "variety", "type", "units"]);
    }
    const dirPath = path.join(
      __dirname.replace("SellerController", "templates"),
      "/smcs_report.html"
    );
    const template = fs.readFileSync(dirPath, "utf8");
    const data = order;
    const html = ejs.render(template, { data: data });
    const options = { format: "Letter" };
    pdf
      .create(html, options)
      .toFile(
        `./public/sellers/${req.seller._id}/smcs_report.pdf`,
        function (err, res1) {
          if (err) return console.log(err);
          console.log(res1);
        }
      );
    if (station.a4_printer.local) {
      res.status(200).json(
        success(
          "success",
          {
            file: `${process.env.BASE_URL}/Sellers/${req.seller._id}/smcs_report.pdf`,
          },
          res.statusCode
        )
      );
    } else {
      await sendMail(station.a4_printer.email, "Order Detail", "");
      res
        .status(200)
        .json(success("Order Detail Printed Successfully", {}, res.statusCode));
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.printOrderList = async (req, res, next) => {
  try {
    const { orderIds, stationId } = req.body;
    console.log(req.body);
    if (!orderIds.length) {
      return res
        .status(200)
        .json(error("Please provide order Id", res.statusCode));
    }

    const orders = await Order.find({ _id: { $in: orderIds } }).populate(
      "buyer"
    );
    if (!stationId) {
      return res
        .status(200)
        .json(error("Please provide station Id", res.statusCode));
    }
    const station = await SellerStation.findById(stationId);
    if (!station) {
      return res.status(200).json(error("Invalid station Id", res.statusCode));
    }
    if (!station.a4_printer.email && !station.a4_printer.local) {
      return res
        .status(200)
        .json(error("No A4 Printer added in selected station", res.statusCode));
    }
    const dirPath = path.join(
      __dirname.replace("SellerController", "templates"),
      "/smcs_report.html"
    );
    const template = fs.readFileSync(dirPath, "utf8");
    const data = orders;
    const html = ejs.render(template, { data: data });
    const options = { format: "Letter" };
    pdf
      .create(html, options)
      .toFile(
        `./public/sellers/${req.seller._id}/order_list.pdf`,
        function (err, res1) {
          if (err) return console.log(err);
          console.log(res1);
        }
      );
    if (station.a4_printer.local) {
      res.status(200).json(
        success(
          "success",
          {
            file: `${process.env.BASE_URL}/Sellers/${req.seller._id}/order_list.pdf`,
          },
          res.statusCode
        )
      );
    } else {
      await sendMail(station.a4_printer.email, "Confirmed Orders", "");
      res
        .status(200)
        .json(success("Orders Printed Successfully", {}, res.statusCode));
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
