const mongoose = require("mongoose");

const ProductUnitSchema = new mongoose.Schema(
  {
    variety: {
      type: mongoose.Types.ObjectId,
      ref: "productVariety",
      required: true,
    },
    unit: {
      type: mongoose.Types.ObjectId,
      ref: "unit",
      required: true,
    },
    added_by: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: {} },
  { collection: "productUnit" }
);

const ProductUnit = mongoose.model("productUnit", ProductUnitSchema);

module.exports = ProductUnit;
