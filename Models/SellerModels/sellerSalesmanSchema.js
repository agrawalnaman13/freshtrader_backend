const mongoose = require("mongoose");

const SellerSalesmanSchema = new mongoose.Schema(
  {
    nick_name: {
      type: String,
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
  },
  { timestamps: {} },
  { collection: "sellerSalesman" }
);

const SellerSalesman = mongoose.model("sellerSalesman", SellerSalesmanSchema);

module.exports = SellerSalesman;
