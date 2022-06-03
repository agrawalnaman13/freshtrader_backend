const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema(
  {
    plan_name: {
      type: String,
      required: true,
    },
    plan_duration: {
      type: Number,
      required: true,
    },
    plan_price: {
      type: Number,
      required: true,
    },
    plan_features: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: {} },
  { collection: "subscription" }
);

const Subscription = mongoose.model("subscription", SubscriptionSchema);

module.exports = Subscription;
