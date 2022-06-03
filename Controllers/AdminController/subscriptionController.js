const mongoose = require("mongoose");
const Subscription = require("../../Models/AdminModels/subscriptionSchema");
const SubscriptionHistory = require("../../Models/BuyerModels/subscriptionHistorySchema");
const { success, error } = require("../../service_response/adminApiResponse");

exports.addSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.create(req.body);
    res
      .status(200)
      .json(
        success(
          "Subscription Added Successfully",
          { subscription },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
exports.getSubscriptionDetail = async (req, res) => {
  try {
    const { filterBy, subscriptionId } = req.body;
    if (!subscriptionId) {
      return res
        .status(200)
        .json(error("Please provide your subscription id", res.statusCode));
    }
    const history = await SubscriptionHistory.aggregate([
      {
        $match: {
          plan: mongoose.Types.ObjectId(subscriptionId),
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
      {
        $match: {
          $and: [
            filterBy === 1 ? { status: "Active" } : {},
            filterBy === 2 ? { status: "Expired" } : {},
          ],
        },
      },
    ]);
    res
      .status(200)
      .json(
        success(
          "Subscription History Fetched Successfully",
          { history },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getSubscriptionList = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().sort({ createdAt: -1 });
    res
      .status(200)
      .json(
        success(
          "Subscriptions Fetched Successfully",
          { subscriptions },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.changeSubscriptionStatus = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res
        .status(200)
        .json(error("Invalid subscription id", res.statusCode));
    }
    subscription.status = !subscription.status;
    await subscription.save();
    res
      .status(200)
      .json(
        success("Status Updated Successfully", { subscription }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
