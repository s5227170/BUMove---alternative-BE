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
  signIn: async (_root, { email, password }, { req, res }) => {
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

    const oldRToken = await Token.findOne({ userId: user._id.toString() });
    if (oldRToken) {
      const validOldToken = jwt.verify(
        oldRToken.value,
        process.env.REFRESH_TOKEN_SECRET
      );
      if(!validOldToken){
        await Token.deleteOne({ userId: user._id.toString() });
      }
    }

    const tokens = await createTokens(user);

    res.cookie("access-token", tokens.accessToken, {
      maxAge: 60 * 1000 * 15,
    });
    res.cookie("refresh-token", tokens.refreshToken, {
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });

    return true;
  },
  user: async (_, __, { req, res }) => {
    if (!req.userId) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId.toString());
    if (!user) {
      const error = new Error("No user found!");
      error.code = 404;
      throw error;
    }

    return { ...user._doc, _id: user._id.toString() };
  },
  rents: async (_, { req, res }) => {
    const rents = await Rent.find().sort({ createdAt: -1 }).populate("author");

    return {
      rents: rents.map((rent) => {
        return {
          ...rent._doc,
          _id: rent._id.toString(),
          createdAt: rent.createdAt.toISOString(),
          updatedAt: rent.updatedAt.toISOString(),
        };
      }),
    };
  },
  rent: async (_, { id }, { req, res }) => {
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
  conversations: async (_, {}, { req, res }) => {
    if (!req.userId) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }

    const convosHome = await Conversation.find({ home: req.userId}).populate("rentId")

    const convosAway = await Conversation.find({ away: req.userId}).populate("rentId")

    const allConvos = convosHome.concat(convosAway)
    
    console.log(convosHome)
    console.log(convosAway)
    console.log("=======")
    console.log(allConvos)

    return {
      conversations: allConvos.map((convo) => {
        return {
          ...convo._doc,
          _id: convo._id.toString(),
          createdAt: convo.createdAt.toISOString(),
          updatedAt: convo.updatedAt.toISOString(),
        };
      }),
    };
  },
  conversation: async (_, { id }, { req, res }) => {
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
  conversationByRent: async (_, { rentId }, { req, res }) => {
    if (!req.userId) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }


    const convo = await Conversation.findOne({ rentId: rentId }).populate("texts");

    if(convo){
      return {
        ...convo._doc,
        _id: convo._id.toString(),
        createdAt: convo.createdAt.toISOString(),
        updatedAt: convo.updatedAt.toISOString(),
      };
    }

    return 
    
  },
  loadTexts: async ({ conversation }, req) => {
    if (!req.userId) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }

    const texts = await Texts.find({ conversation: conversation._id }).sort({ createdAt: -1 });
    
    return {
      texts: texts.map((text) => {
        //if (conversation == text.conversation.toString())
          return {
            ...text._doc,
            _id: text._id.toString(),
            createdAt: rent.createdAt.toISOString(),
            updatedAt: rent.updatedAt.toISOString(),
          };
      }),
    };
  },
};

module.exports = Query;
