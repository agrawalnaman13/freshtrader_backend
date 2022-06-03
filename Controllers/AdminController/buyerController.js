const mongoose = require("mongoose");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const SubscriptionHistory = require("../../Models/BuyerModels/subscriptionHistorySchema");
exports.getBuyerData = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.id);
    if (!buyer) {
      return res.status(200).json(error("Invalid buyer id", res.statusCode));
    }
    const history = await SubscriptionHistory.aggregate([
      {
        $match: {
          buyer: mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          localField: "plan",
          foreignField: "_id",
          from: "subscriptions",
          as: "plan",
        },
      },
      { $unwind: "$plan" },
      {
        $addFields: {
          status: {
            $cond: {
              if: { $lt: ["$valid_till", new Date(Date.now())] },
              then: "Expired",
              else: "Active",
            },
          },
        },
      },
    ]);
    res
      .status(200)
      .json(
        success(
          "Profile Fetched Successfully",
          { buyer, history },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getBuyerList = async (req, res) => {
  try {
    const { filterBy } = req.body;
    const buyers = await Buyer.find({
      $and: [
        filterBy === 1 ? { market: "Sydney Produce and Growers Market" } : {},
        filterBy === 2 ? { market: "Sydney Flower Market" } : {},
      ],
    }).sort({ createdAt: -1 });
    res
      .status(200)
      .json(success("Buyers Fetched Successfully", { buyers }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.changeBuyerStatus = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.id);
    if (!buyer) {
      return res.status(200).json(error("Invalid buyer id", res.statusCode));
    }
    buyer.status = !buyer.status;
    await buyer.save();
    res
      .status(200)
      .json(success("Status Updated Successfully", { buyer }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
