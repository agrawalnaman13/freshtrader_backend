const mongoose = require("mongoose");

const SellerPOSLayoutSchema = new mongoose.Schema(
  {
    category: {
      type: Array,
      default: [],
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
    variety: {
      type: Object,
      default: { fruits: [], vegetables: [], herbs: [], others: [] },
    },
  },
  { timestamps: {} },
  { collection: "sellerPOSLayout" }
);

const SellerPOSLayout = mongoose.model(
  "sellerPOSLayout",
  SellerPOSLayoutSchema
);

module.exports = SellerPOSLayout;
