const mongoose = require("mongoose");
const moment = require("moment");
const { success, error } = require("../../service_response/adminApiResponse");
const Subscription = require("../../Models/AdminModels/subscriptionSchema");
const SubscriptionHistory = require("../../Models/BuyerModels/subscriptionHistorySchema");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
const stripe = require("stripe")(
  "sk_test_51KqCaeKPM89X1Av0VpuPrVIFt13lhckjxYOSVJS9DVDcUuQnk0NMkYtOzl9OndaerAKQjKw9JGbF3ojMy8CQUdki00UqITEbvX"
);
exports.buyPlan = async (req, res, next) => {
  try {
    const { planId, id } = req.body;
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
    if (!id && plan.plan_name !== "Free") {
      return res
        .status(200)
        .json(error("Please provide stripe token", res.statusCode));
    }
    let date = moment.utc();
    date = moment(date).format("MM-DD-YYYY");
    const jDateToday = new Date(date);
    const local_date = moment(jDateToday);
    const till = moment(local_date).add(+plan.plan_duration, "months");
    if (plan.plan_name !== "Free") {
      stripe.charges.create(
        {
          amount: +plan.plan_price * 100,
          currency: "aud",
          source: id,
          description: `Purchased ${plan.plan_name} plan`,
          metadata: {
            planId: planId,
          },
        },
        async function (err, charge) {
          if (err) {
            console.log(err);
            res.status(200).json(error("Payment Failed", res.statusCode));
          } else {
            await SubscriptionHistory.create({
              buyer: req.buyer._id,
              plan: planId,
              valid_till: till,
            });
            await Buyer.findByIdAndUpdate(req.buyer._id, { plan: planId });
            return res
              .status(200)
              .json(success("Plan Purchased Successfully", {}, res.statusCode));
          }
        }
      );
    } else {
      await SubscriptionHistory.create({
        buyer: req.buyer._id,
        plan: planId,
        valid_till: till,
      });
      await Buyer.findByIdAndUpdate(req.buyer._id, { plan: planId });
      return res
        .status(200)
        .json(success("Plan Purchased Successfully", {}, res.statusCode));
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getMyPlan = async (req, res, next) => {
  try {
    const buyer = await Buyer.findById(req.buyer._id);
    const plan = await SubscriptionHistory.findOne({
      buyer: req.buyer._id,
      plan: buyer.plan,
    }).populate("plan");
    res
      .status(200)
      .json(success("Plan Fetched Successfully", { plan }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getPlans = async (req, res, next) => {
  try {
    const plans = await Subscription.find({ status: true }).sort({
      plan_price: 1,
    });
    res
      .status(200)
      .json(success("Plan Fetched Successfully", { plans }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.checkPlan = async () => {
  try {
    const plans = await SubscriptionHistory.find({
      valid_till: { $lte: new Date(Date.now()) },
    });
    for (const plan of plans) {
      const free = await Subscription.findOne({
        plan_name: "Free",
      });
      if (free) {
        await Buyer.findByIdAndUpdate(plan.buyer, {
          plan: free._id,
        });
      }
    }
    return;
  } catch (err) {
    console.log(err);
    return;
  }
};

exports.payment = async (req, res, next) => {
  try {
    const { id } = req.body;
    stripe.charges.create(
      {
        amount: 200,
        currency: "aud",
        source: id,
        description: `Subscription`,
        metadata: {
          productId: "12345",
        },
      },
      function (err, charge) {
        console.log(charge);
        if (err) {
          console.log(err);
          res.status(200).json(error("Failed", res.statusCode));
        } else {
          res.status(200).json(success("Success", {}, res.statusCode));
        }
      }
    );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
