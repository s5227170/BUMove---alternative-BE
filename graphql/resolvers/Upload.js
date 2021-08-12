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

const Upload = {
    upload: async () => {
        
    }
}

module.exports = Upload