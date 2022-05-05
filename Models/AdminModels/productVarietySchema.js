const mongoose = require("mongoose");

const ProductVarietySchema = new mongoose.Schema(
  {
    product: {
      type: String,
      required: true,
      enum: ["Fruits", "Herbs", "Vegetables", "Others"],
    },
    variety: {
      type: String,
      required: true,
    },
  },
  { timestamps: {} },
  { collection: "productVariety" }
);

const ProductVariety = mongoose.model("productVariety", ProductVarietySchema);

module.exports = ProductVariety;
