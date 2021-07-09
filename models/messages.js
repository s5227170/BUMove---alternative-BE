const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  away: {
    type: String,
    required: true,
  },
  home: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  rentID: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Rent",
  },
  texts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Texts",
    },
  ],
});

module.exports = mongoose.model("Message", messageSchema);
