const mongoose = require("mongoose");
const SubscriptionHistorySchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Types.ObjectId,
      ref: "buyer",
      required: true,
    },
    plan: {
      type: mongoose.Types.ObjectId,
      ref: "subscription",
      required: true,
    },
    valid_till: {
      type: Date,
      required: true,
    },
  },
  { timestamps: {} },
  { collection: "SubscriptionHistory" }
);

const SubscriptionHistory = mongoose.model(
  "SubscriptionHistory",
  SubscriptionHistorySchema
);

module.exports = SubscriptionHistory;
