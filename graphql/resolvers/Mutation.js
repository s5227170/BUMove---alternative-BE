const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { GraphQLUpload } = require("graphql-upload");

const io = require("../../socket");
const User = require("../../models/user");
const Rent = require("../../models/rent");
const user = require("../../models/user");
const Conversation = require("../../models/conversation");
const Texts = require("../../models/texts");
const Token = require("../../models/token");
const createTokens = require("../../middleware/auth");

const Mutation = {
  signUp: async (_, { data }, { req, res }) => {
    const errors = [];
    if (!validator.isEmail(data.email)) {
      errors.push({ message: "E-Mail is invalid." });
    }
    if (
      validator.isEmpty(data.password) ||
      !validator.isLength(data.password, { min: 8 })
    ) {
      errors.push({
        message: "Password is too short! It must be 8 characters at least",
      });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = await User.findOne({ email: data.email });

    if (existingUser) {
      const error = new Error("User exists already!");
      throw error;
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = new User({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      admin: false,
      avatar: "",
    });

    const createdUser = await user.save();

    const { accessToken, refreshToken } = createTokens(user);

    res.cookie("refresh-token", accessToken, { maxAge: 60 * 1000 * 15 });
    res.cookie("refresh-token", refreshToken, {
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });

    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  createRent: async (_, { rent }, { req, res }) => {
    if (!req.userId) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }

    rent = JSON.parse(JSON.stringify(rent));

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid user!");
      error.code = 401;
      throw error;
    }

    if (
      !rent.title ||
      !rent.type ||
      !rent.information ||
      !rent.location ||
      !rent.status ||
      !rent.price ||
      !rent.images ||
      !rent.imgnames ||
      !rent.rooms
    ) {
      const error = new Error("Invalid input. Faulty data.");
      error.code = 422;
      throw error;
    }
    const errors = [];

    if (
      validator.isEmpty(rent.title) ||
      !validator.isLength(rent.title, { min: 6 })
    ) {
      errors.push({
        message:
          "Title is either missing or not long enough. Minimum for title is 6 leters.",
      });
    }
    if (validator.isEmpty(rent.type)) {
      errors.push({ message: "The offer type must be set." });
    }
    if (
      validator.isEmpty(rent.information) ||
      !validator.isLength(rent.information, { max: 500 })
    ) {
      errors.push({
        message: "The information field can contain a maximum of 500 symbols.",
      });
    }
    if (!rent.location.lat || !rent.location.lng) {
      errors.push({ message: "Invalid location." });
    }
    if (rent.price > 10000 || rent.price <= 0) {
      errors.push({
        message:
          "Entered value for price is invalid. Maximum allowed price is 10 000.",
      });
    }
    if (rent.images.length > 10) {
      errors.push({ message: "Maximum allowed number of images is 10." });
    }
    if (rent.images.length != rent.imgnames.length) {
      errors.push({ message: "There was a problem uploading images." });
    }
    if (rent.images.length <= 0) {
      errors.push({ message: "Offers require at least one image." });
    }
    if (rent.rooms.length <= 0) {
      errors.push({ message: "At least one room must be specified." });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const newRent = new Rent({
      author: user,
      title: rent.title,
      type: rent.type,
      information: rent.information,
      location: rent.location,
      status: rent.status,
      price: rent.price,
      images: rent.images,
      imgnames: rent.imgnames,
      rooms: rent.rooms,
    });

    const createdRent = await newRent.save();
    user.rents.push(createdRent);

    await user.save();
    return {
      ...createdRent._doc,
      id: createdRent._id.toString(),
      createdAt: createdRent.createdAt.toISOString(),
      updatedAt: createdRent.updatedAt.toISOString(),
    };
  },
  updateRent: async (_, { rent, id }, { req, res }) => {
    if (!req.userId) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid user!");
      error.code = 401;
      throw error;
    }

    const newRent = await Rent.findById(id).populate("author");
    if (!rent) {
      const error = new Error("No offer found!");
      error.code = 404;
      throw error;
    }

    if (newRent.author._id.toString() !== req.userId.toString()) {
      const error = new Error("Not authorized!");
      error.code = 403;
      throw error;
    }

    const errors = [];

    if (
      validator.isEmpty(rent.title) ||
      !validator.isLength(rent.title, { min: 10 })
    ) {
      errors.push({ message: "Title is either not long enough." });
    }
    if (validator.isEmpty(rent.type)) {
      errors.push({ message: "The offer type must be set." });
    }
    if (
      validator.isEmpty(rent.information) ||
      !validator.isLength(rent.information, { max: 500 })
    ) {
      errors.push({
        message: "The information field can contain a maximum of 500 symbols.",
      });
    }
    if (!rent.location.lat || !rent.location.lng) {
      errors.push({ message: "Invalid location." });
    }
    if (rent.price > 10000 || rent.price <= 0) {
      errors.push({
        message:
          "Entered value for price is invalid. Maximum allowed price is 10 000.",
      });
    }
    if (rent.images.length > 10) {
      errors.push({ message: "Maximum allowed number of images is 10." });
    }
    if (rent.images.length != rent.imgnames.length) {
      errors.push({ message: "There was a problem uploading images." });
    }
    if (rent.images.length <= 0) {
      errors.push({ message: "Offers require at least one image." });
    }
    if (rent.rooms.length <= 0) {
      errors.push({ message: "At least one room must be specified." });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    newRent.title = rent.title;
    newRent.type = rent.type;
    newRent.information = rent.information;
    newRent.location = rent.location;
    newRent.status = rent.status;
    newRent.price = rent.price;
    newRent.images = rent.images;
    newRent.imgnames = rent.imgnames;
    newRent.rooms = rent.rooms;
    if (rent.convos) {
      newRent.convos = rent.convos;
    }

    const uploadedNewRent = await newRent.save();

    return {
      ...uploadedNewRent._doc,
      _id: uploadedNewRent._id.toString(),
      createdAt: uploadedNewRent.createdAt.toISOString(),
      updatedAt: uploadedNewRent.updatedAt.toISOString(),
    };
  },
  deleteRent: async function (_, { id }, { req, res }) {
    if (!req.userId) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    const rent = await Rent.findById(id);
    if (!rent) {
      const error = new Error("No rent found!");
      error.code = 404;
      throw error;
    }
    if (rent.author.toString() !== req.userId.toString()) {
      const error = new Error("Not authorized!");
      error.code = 403;
      throw error;
    }
    //insert the image deletion related to the rent
    await Rent.findByIdAndRemove(id);
    user.rents.pull(id);
    await user.save();
    return true;
  },
  createConversation: async (_, { conversation }, { req, res }) => {
    if (!req.userId) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid user!");
      error.code = 401;
      throw error;
    }

    if (!conversation.rentId || !conversation.away) {
      const error = new Error("Invalid input. Faulty data.");
      error.code = 422;
      throw error;
    }

    const errors = [];

    if (validator.isEmpty(conversation.away)) {
      errors.push({ message: "Selected user for contact has not been found." });
    }
    if (validator.isEmpty(conversation.rentId)) {
      errors.push({
        message:
          "There was a problem searching for the conversation in the database. ",
      });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const rent = await Rent.findById(conversation.rentId);
    if (!rent) {
      const error = new Error("Offer does not exist anymore");
      error.code = 404;
      throw error;
    }
    const away = await User.findById(conversation.away);
    if (!away) {
      const error = new Error("There was a problem contacting the user.");
      error.code = 404;
      throw error;
    }

    const newConversation = new Conversation({
      home: user._id.toString(),
      away: away._id.toString(),
      rentId: rent._id,
      name: rent.title,
      texts: [],
    });

    const createdConversation = await newConversation.save();
    rent.convos.push(createdConversation);
    //add the socket BS here
    // io.getIO.emit("conversations", {
    //   action: "create",
    //   conversation: createdConversation,
    // });

    await rent.save();
    return {
      ...createdConversation._doc,
      id: createdConversation._id.toString(),
      createdAt: createdConversation.createdAt.toISOString(),
      updatedAt: createdConversation.updatedAt.toISOString(),
    };
  },
  updateConversation: async ({ id, conversation }, req) => {
    if (!req.userId) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
  },
  deleteConversation: async ({ id }, req) => {
    if (!req.userId) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
  },
  sendText: async (_, { text }, { req, res }) => {
    if (!req.userId) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }

    if (text.content.length > 2000) {
      const error = new Error("Message too long");
      error.code = 422;
      throw error;
    }

    const existingConvo = await Conversation.findById(text.conversation).populate("Texts");

    if(!existingConvo) {
      const error = new Error("Problem loading the conversation.")
      error.code = 404;
      throw error;
    }

    const existingRent = await Rent.findById(existingConvo.rentId);

    if (!existingRent) {
      const error = new Error("No such offer found!");
      error.code = 404;
      throw error;
    }

    const confirmedReceiver = await User.findById(text.receiver);
    if (!confirmedReceiver) {
      const error = new Error("No such user found.");
      error.code = 404;
      throw error;
    }

    const newText = new Texts({
      author: req.userId,
      content: text.content,
      name: existingRent.title,
      receiver: confirmedReceiver._id,
      conversation: existingConvo,
    });

    const createdText = await newText.save();

    existingConvo.texts.push(createdText);
    await existingConvo.save();

    //continue with the real-time implementation
    io.getIO().emit("Texts", {
       action: "create", text: {...createdText._doc, conversation: existingConvo },
    });

    return {
      ...createdText._doc,
      id: createdText._id.toString(),
      createdAt: createdText.createdAt.toISOString(),
      updatedAt: createdText.updatedAt.toISOString(),
    };
  },
};

module.exports = Mutation;
