const mongoose = require("mongoose");
const moment = require("moment");
const { success, error } = require("../../service_response/adminApiResponse");
const Subscription = require("../../Models/AdminModels/subscriptionSchema");
const SubscriptionHistory = require("../../Models/BuyerModels/subscriptionHistorySchema");
exports.buyPlan = async (req, res, next) => {
  try {
    const { planId } = req.body;
    console.log(req.body);
    if (!planId) {
      return res
        .status(200)
        .json(error("Please provide plan id", res.statusCode));
    }
    const plan = await Subscription.findById(planId);
    if (!plan) {
      return res.status(200).json(error("Invalid plan id", res.statusCode));
    }
    let date = moment.utc();
    date = moment(date).format("MM-DD-YYYY");
    const jDateToday = new Date(date);
    const local_date = moment(jDateToday);
    const till = moment(local_date).add(+plan.plan_duration, "months");
    await SubscriptionHistory.create({
      buyer: req.buyer._id,
      plan: planId,
      valid_till: till,
    });
    res
      .status(200)
      .json(success("Plan Purchased Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getMyPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionHistory.findOne({
      buyer: req.buyer._id,
      valid_till: { $gt: new Date(Date.now()) },
    }).populate("plan");
    res
      .status(200)
      .json(success("Plan Fetched Successfully", { plan }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
