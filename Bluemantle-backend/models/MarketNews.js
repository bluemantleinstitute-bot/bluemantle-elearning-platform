const mongoose = require("mongoose");

const marketNewsSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    abstract: {
      type: String,
      required: true,
    },
    trending: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketNews", marketNewsSchema);
