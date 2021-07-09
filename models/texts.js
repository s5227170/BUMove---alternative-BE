const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const textsSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    convoID: {
      type: Schema.Types.ObjectId,
      ref: "Messages",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Texts", textsSchema);
