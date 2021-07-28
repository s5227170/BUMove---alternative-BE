const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const textsSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Messages",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Texts", textsSchema);
