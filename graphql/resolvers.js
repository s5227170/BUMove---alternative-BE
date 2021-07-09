const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Rent = require("../models/rent");

module.exports = {
  signUp: async ({ userData }, req) => {
    const errors = [];
    if (!validator.isEmail(userData.email)) {
      errors.push({ message: "E-Mail is invalid." });
    }
    if (
      validator.isEmpty(userData.password) ||
      !validator.isLength(userData.password, { min: 8 })
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
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      const error = new Error("User exists already!");
      throw error;
    }
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = new User({
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
      admin: false,
      avatar: "",
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  signIn: async ({ email, password }, req) => {
    const errors = [];

    if (validator.isEmpty(email)) {
      errors.push({ message: "Please enter an E-Mail." });
    }
    if (!validator.isEmail(email)) {
      errors.push({ message: "Please enter a valid E-Mail " });
    }
    if (validator.isEmpty(password)) {
      errors.push({ message: "Please enter password" });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = 403;
      throw error;
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      const error = new Error("User not found.");
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Password is incorrect.");
      error.code = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      "somesupersecretsecret",
      { expiresIn: "15m" }
    );
    return { token: token, userId: user };
  },
  createRent: async ({ rent }, req) => {
    if (!req.isAuth) {
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
    console.log(rent)

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
  updateRent: async ({rent, id}, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }

    const newRent = await Rent.findById(id).populate("author");
    if(!rent) {
      const error = new Error("No offer found!");
      error.code = 404;
      throw error;
    }

    if(rent.author._id.toString() !== req.userId.toString()) {
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
    if (validator.isEmpty(location.lat) || validator.isEmpty(location.lng)) {
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
    if (rent.rooms <= 0) {
      errors.push({ message: "At least one room must be specified." });
    }
    if (errorslength > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    newRent.author = rent.author
    newRent.title = rent.title;
    newRent.type = rent.type;
    newRent.information = rent.information;
    newRent.location = rent.location;
    newRent.status = rent.status;
    newRent.price = rent.price;
    newRent.images = rent.images;
    newRent.imgnames = rent.imgnames;
    newRent.rooms = rent.rooms;
    if(rent.convos) {
      newRent.convos = rent.convos;
    }

    const uploadedNewRent = await newRent.save();
    return {
      ...uploadedNewRent._doc,
      _id: uploadedNewRent._id.toString(),
      createdAt: uploadedNewRent.createdAt.toISOString(),
      updatedAt: uploadedNewRent.updatedAt.toISOString(),
    };
  }
};
