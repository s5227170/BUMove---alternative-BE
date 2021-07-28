const path = require("path");

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");

//This has been added in order to reach .env file
const { ApolloServer } = require("apollo-server-express");

const dotenv = require("dotenv-flow");
dotenv.config();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const Token = require("./models/token");
const User = require("./models/user");

const typeDefs = require("./graphql/schema");
const Query = require("./graphql/resolvers/Query");
const Mutation = require("./graphql/resolvers/Mutation");

const { clearImage } = require("./util/file");
const createTokens = require("./middleware/auth");

const apollo = new ApolloServer({
  typeDefs,
  resolvers: {
    Query,
    Mutation
  },
  context: ({ req, res }) => ({
    req,
    res,
  }),
});

const app = express();

app.use(cookieParser());

// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "images");
//   },
//   filename: (req, file, cb) => {
//     cb(null, "\\" + file.originalname);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (
//     file.mimetype === "image/png" ||
//     file.mimetype === "image/jpg" ||
//     file.mimetype === "image/jpeg"
//   ) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

//app.use(express.json());

// app.use(
//   multer({ storage: fileStorage, fileFilter: fileFilter }).array("image")
// );

app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// app.use(async (req, res, next) => {
//   const accessToken = req.cookies["access-token"];
//   const refreshToken = req.cookies["refresh-token"];

//   if (!refreshToken && !accessToken) {
//     return next();
//   }

//   try {
//     const confirmAToken = verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
//     if (!confirmAToken) next();
//   } catch (e) {}

//   if (!refreshToken) {
//     return next();
//   }

//   let confirmRToken;

//   try {
//     confirmRToken = verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//   } catch (e) {
//     return next();
//   }

//   const user = await User.findOne(confirmRToken.userId);
//   const existingRToken = await Token.findOne({ value: refreshToken });
//   if (!existingRToken) {
//     console.log("Non-existant refresh token!");
//     return next();
//   }
//   req.userId = user._id;

//   const newTokens = createTokens(user);
//   res.cookie("refresh-token", newTokens.accessToken, {
//     maxAge: 60 * 1000 * 15,
//   });
//   res.cookie("refresh-token", newTokens.refreshToken, {
//     maxAge: 60 * 1000 * 60 * 24 * 7,
//   });

//   next();
// });

// app.put("/post-image", (req, res, next) => {
//   if (!req.userId) {
//     throw new Error("Not authenticated!");
//   }
//   if (!req.file) {
//     return res.status(200).json({ message: "No file provided!" });
//   }
//   if (req.body.oldPath) {
//     clearImage(req.body.oldPath);
//   }
//   return res
//     .status(201)
//     .json({ message: "File stored", filePath: req.file.path });
// });

// app.use((error, req, res, next) => {
//   console.log(error);
//   const status = error.statusCode || 500;
//   const message = error.message;
//   const data = error.data;
//   res.status(status).json({ message: message, data: data });
// });
//the process.env.DB has its value in .env
mongoose
  .connect(
    process.env.DB,
    { useNewUrlParser: true },
    { useUnifiedTopology: true }
  )
  .then(async (result) => {
    await apollo.start();
    apollo.applyMiddleware({ app });

    const server = app.listen(8080);
    const io = require("socket.io")(server);
    io.on("connection", (socket) => {});
  })
  .catch((err) => console.log(err));
