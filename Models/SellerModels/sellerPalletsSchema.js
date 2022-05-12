const mongoose = require("mongoose");

const SellerPalletsSchema = new mongoose.Schema(
  {
    received_from: {
      type: mongoose.Types.ObjectId,
      ref: "sellerSupplier",
    },
    taken_by: {
      type: mongoose.Types.ObjectId,
      ref: "buyer",
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
    pallets_received: {
      type: Number,
    },
    pallets_taken: {
      type: Number,
    },
    pallets_on_hand: {
      type: Number,
    },
  },
  { timestamps: {} },
  { collection: "sellerPallets" }
);

const SellerPallets = mongoose.model("sellerPallets", SellerPalletsSchema);

module.exports = SellerPallets;
