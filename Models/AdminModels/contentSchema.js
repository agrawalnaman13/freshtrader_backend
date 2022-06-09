const mongoose = require("mongoose");
const ContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["Policy", "Condition", "About Us"],
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: {} },
  { collection: "content" }
);

const Content = mongoose.model("content", ContentSchema);

module.exports = Content;
