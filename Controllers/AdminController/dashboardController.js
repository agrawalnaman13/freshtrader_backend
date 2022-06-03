const mongoose = require("mongoose");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");

exports.getDashboardCount = async (req, res) => {
  try {
    const buyerCount = await Buyer.find().countDocuments();
    const sellerCount = await Wholeseller.find().countDocuments();
    res
      .status(200)
      .json(
        success(
          "Count Fetched Successfully",
          { buyerCount, sellerCount },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
