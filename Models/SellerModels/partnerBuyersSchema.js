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
  },
  { timestamps: {} },
  { collection: "sellerPartnerBuyers" }
);

const SellerPartnerBuyers = mongoose.model(
  "sellerPartnerBuyers",
  SellerPartnerBuyersSchema
);

module.exports = SellerPartnerBuyers;
