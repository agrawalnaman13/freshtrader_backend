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
      enum: [
        "Transaction Edit",
        "Account Edit",
        "Customer File Edit",
        "Transaction Processed",
        "Consignment Created",
        "Consignment Edit",
        "SMCS Sent",
      ],
      required: true,
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
