const mongoose = require("mongoose");

const SellerStationSchema = new mongoose.Schema(
  {
    station: {
      type: String,
      required: true,
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
    a4_printer: {
      type: Object,
      default: {
        email: "",
        local: false,
      },
    },
    thermal_printer: {
      type: Array,
      default: [{}],
    },
    card_reader: {
      type: Array,
      default: [{}],
    },
  },
  { timestamps: {} },
  { collection: "sellerStation" }
);

const SellerStation = mongoose.model("sellerStation", SellerStationSchema);

module.exports = SellerStation;
