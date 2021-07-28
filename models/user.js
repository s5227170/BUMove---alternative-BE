const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: false,
    },
    admin: {
      type: Boolean,
      required: true,
    },
    avatar: {
      type: String,
    },
    rents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Rent",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
