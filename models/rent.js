const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rentSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  images: [
    {
      type: String,
    },
  ],
  imgnames: [
    {
      type: String,
    },
  ],
  information: {
    type: String,
    required: true,
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  price: {
    type: Number,
    required: true,
  },
  rooms: [
    {
      size: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  convos: [
    {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Rent", rentSchema);
