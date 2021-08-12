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
    createRent: async (_, { rent }, { req, res }) => {
        console.log(rent)
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
        console.log(errors);
    
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
      createConversation: async ({ conversation }, req) => {
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
        const away = await user.findById(conversation.away);
        if (!away) {
          const error = new Error("There was a problem contacting the user.");
          error.code = 404;
          throw error;
        }
    
        const newConversation = new Conversation({
          home: user,
          away: away,
          rentId: rent._id,
          name: rent.title,
          texts: [],
        });
    
        const createdConversation = await newConversation.save();
        rent.convos.push(createdConversation);
    
        await rent.save();
        return {
          ...createdConversation,
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
};

module.exports = Mutation;
