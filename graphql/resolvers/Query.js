const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const io = require("../../socket");
const User = require("../../models/user");
const Rent = require("../../models/rent");
const user = require("../../models/user");
const Conversation = require("../../models/conversation");
const Texts = require("../../models/texts");
const Token = require("../../models/token");
const createTokens = require("../../middleware/auth");

const Query = {
    signIn: async ( email, password, { context }) => {
        const errors = [];

        console.log(email)
        console.log(password)
    
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
    
        const { accessToken, refreshToken } = createTokens(user)
    
        res.cookie("refresh-token", accessToken, { maxAge: 60 * 1000 * 15 });
        res.cookie("refresh-token", refreshToken, {
          maxAge: 60 * 1000 * 60 * 24 * 7,
        });
        console.log(user)
    
        return { user: user };
      },
      user: async (_, __, { context }) => {
        if (!context.req.userId) {
          const error = new Error("Not authenticated!");
          error.code = 401;
          throw error;
        }
    
        const user = await User.findById(req.userId);
        if (!user) {
          const error = new Error("No user found!");
          error.code = 404;
          throw error;
        }
    
        console.log(user)
        
        return { user };
      },
      rents: async (req) => {
        const rents = await Rent.find().sort({ createdAt: -1 }).populate("author");
    
        return rents;
      },
      rent: async ({ id }, req) => {
        const rent = await Rent.findById(id).populate("author");
        if (!rent) {
          const error = new Error("No rent found!");
          error.code = 404;
          throw error;
        }
        return {
          ...rent._doc,
          _id: rent._id.toString(),
          createdAt: rent.createdAt.toISOString(),
          updatedAt: rent.updatedAt.toISOString(),
        };
      },
      conversations: async ({}, req) => {
        if (!req.userId) {
          const error = new Error("Not authenticated!");
          error.code = 401;
          throw error;
        }
    
        const convosHome = await Conversation.find()
          .where("home")
          .isEqual(req.userId);
        const convosAway = await Conversation.find()
          .where("away")
          .isEqual(req.userId)
          .where("home")
          .isEqual(req.userId.toString())
          .sort({ updatedAt: 1 });
    
        return convos;
      },
      conversation: async ({ id }, req) => {
        if (!req.userId) {
          const error = new Error("Not authenticated!");
          error.code = 401;
          throw error;
        }
    
        const convo = await Conversation.findById(id);
    
        return {
          ...convo._doc,
          _id: convo._id.toString(),
          createdAt: rent.createdAt.toISOString(),
          updatedAt: rent.updatedAt.toISOString(),
        };
      },
      conversationByRent: async ({ rentId }, req) => {
        if (!req.userId) {
          const error = new Error("Not authenticated!");
          error.code = 401;
          throw error;
        }
    
        const convo = await Conversation.findOne({ rentId: rentId });
    
        return {
          ...convo._doc,
          _id: convo._id.toString(),
          createdAt: rent.createdAt.toISOString(),
          updatedAt: rent.updatedAt.toISOString(),
        };
      },
}

module.exports = Query