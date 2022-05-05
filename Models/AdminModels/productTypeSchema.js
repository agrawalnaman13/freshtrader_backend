const mongoose = require("mongoose");

const ProductTypeSchema = new mongoose.Schema(
  {
    variety: {
      type: mongoose.Types.ObjectId,
      ref: "productVariety",
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: {} },
  { collection: "productType" }
);

const ProductType = mongoose.model("productType", ProductTypeSchema);

module.exports = ProductType;
