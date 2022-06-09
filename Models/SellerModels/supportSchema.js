let mongoose = require("mongoose");

const Reply = new mongoose.Schema(
  {
    message: {
      type: String,
    },
    replyBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const SupportSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    concern: {
      type: String,
      required: true,
    },
    reply: [Reply],
    type: {
      type: String,
      required: false,
      enum: ["Seller", "Buyer"],
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
const Support = mongoose.model("support", SupportSchema);

module.exports = Support;
