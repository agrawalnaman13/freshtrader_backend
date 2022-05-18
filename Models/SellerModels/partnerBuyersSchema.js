const mongoose = require("mongoose");

const SellerPartnerBuyersSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Types.ObjectId,
      ref: "buyer",
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    total: {
      type: Number,
      default: 0,
    },
    bought: {
      type: Number,
      default: 0,
    },
    paid: {
      type: Number,
      default: 0,
    },
    credit: {
      type: Number,
      default: 0,
    },
    prev_credit: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: {} },
  { collection: "sellerPartnerBuyers" }
);

const SellerPartnerBuyers = mongoose.model(
  "sellerPartnerBuyers",
  SellerPartnerBuyersSchema
);

module.exports = SellerPartnerBuyers;
