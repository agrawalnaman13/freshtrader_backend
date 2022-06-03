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
    added_by: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: {} },
  { collection: "unit" }
);

const Unit = mongoose.model("unit", UnitSchema);

module.exports = Unit;
