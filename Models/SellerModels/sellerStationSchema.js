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
      type: Object,
      default: {},
    },
    card_reader: {
      type: Object,
      default: {
        name: "",
        access_token: "",
        deviceId: "",
      },
    },
  },
  { timestamps: {} },
  { collection: "sellerStation" }
);

const SellerStation = mongoose.model("sellerStation", SellerStationSchema);

module.exports = SellerStation;
