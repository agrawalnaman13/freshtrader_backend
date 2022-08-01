const mongoose = require("mongoose");
const ActivitySchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
    salesman: {
      type: mongoose.Types.ObjectId,
      ref: "sellerStaff",
    },
    account: {
      type: mongoose.Types.ObjectId,
      ref: "sellerStaff",
    },
    event: {
      type: String,
    },
    info: {
      type: Array,
    },
  },
  { timestamps: {} },
  { collection: "activity" }
);

const Activity = mongoose.model("activity", ActivitySchema);

module.exports = Activity;
