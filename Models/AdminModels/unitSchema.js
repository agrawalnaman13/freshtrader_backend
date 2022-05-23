const mongoose = require("mongoose");

const UnitSchema = new mongoose.Schema(
  {
    unit: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
  },
  { timestamps: {} },
  { collection: "unit" }
);

const Unit = mongoose.model("unit", UnitSchema);

module.exports = Unit;
