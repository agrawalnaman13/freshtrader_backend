const mongoose = require("mongoose");

const SMCSReportSchema = new mongoose.Schema(
  {
    week: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
    emailed_on: {
      type: Date,
      required: true,
    },
  },
  { timestamps: {} },
  { collection: "SMCSReport" }
);

const SMCSReport = mongoose.model("SMCSReport", SMCSReportSchema);

module.exports = SMCSReport;
