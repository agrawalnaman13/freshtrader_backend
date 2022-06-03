const mongoose = require("mongoose");

const ProductVarietySchema = new mongoose.Schema(
  {
    product: {
      type: String,
      required: true,
      enum: ["Fruits", "Herbs", "Vegetables", "Others", "Flowers", "Foliage"],
    },
    variety: {
      type: String,
      required: true,
    },
    added_by: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: {} },
  { collection: "productVariety" }
);

const ProductVariety = mongoose.model("productVariety", ProductVarietySchema);

module.exports = ProductVariety;
