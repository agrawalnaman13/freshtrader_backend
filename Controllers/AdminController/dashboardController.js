const mongoose = require("mongoose");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const SubscriptionHistory = require("../../Models/BuyerModels/subscriptionHistorySchema");

exports.getDashboardCount = async (req, res) => {
  try {
    const buyerCount = await Buyer.find().countDocuments();
    const sellerCount = await Wholeseller.find().countDocuments();
    const history = await SubscriptionHistory.find().populate("plan");
    const revenue = history.reduce(function (a, b) {
      return a + b.plan.plan_price;
    }, 0);
    res
      .status(200)
      .json(
        success(
          "Count Fetched Successfully",
          { buyerCount, sellerCount, revenue },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
