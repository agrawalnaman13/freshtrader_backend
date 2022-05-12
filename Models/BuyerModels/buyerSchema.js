const mongoose = require("mongoose");

const BuyerSchema = new mongoose.Schema(
  {
    business_trading_name: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    abn: {
      type: String,
      required: true,
    },
    entity_name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    market_seller: {
      type: Boolean,
      required: true,
    },
    smcs_code: {
      type: String,
    },
  },
  { timestamps: {} },
  { collection: "buyer" }
);

const Buyer = mongoose.model("buyer", BuyerSchema);

module.exports = Buyer;
