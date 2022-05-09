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
    devices: [
      {
        printer_email: {
          type: String,
        },
        type: {
          type: String,
          enum: ["Printer", "Reader"],
        },
      },
    ],
  },
  { timestamps: {} },
  { collection: "sellerStation" }
);

const SellerStation = mongoose.model("sellerStation", SellerStationSchema);

module.exports = SellerStation;
