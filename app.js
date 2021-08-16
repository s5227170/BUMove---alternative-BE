const path = require("path");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");

//This has been added in order to reach .env file
const { ApolloServer } = require("apollo-server-express");

const dotenv = require("dotenv-flow");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const Token = require("./models/token");
const User = require("./models/user");

const typeDefs = require("./graphql/schema");
const Query = require("./graphql/resolvers/Query");
const Mutation = require("./graphql/resolvers/Mutation");

const { clearImage } = require("./util/file");
const createTokens = require("./middleware/auth");
const { v4 } = require("uuid");

(async () => {
  const app = express();

  const fileStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
      let accessToken = "";
      let refreshToken = "";

      let cookieNames = Object.keys(req.cookies);
      let cookieValues = Object.values(req.cookies);

      for (let i = 0; i < cookieNames.length; i++) {
        if (cookieNames[i] == "refresh-token") {
          refreshToken = cookieValues[i];
        } else if (cookieNames[i] == "access-token") {
          accessToken = cookieValues[i];
        }
      }

      if (!refreshToken && !accessToken) {
        return cb("Both tokens missing!", "images");
      }

      try {
        const confirmAToken = jwt.verify(
          accessToken,
          process.env.ACCESS_TOKEN_SECRET
        );

        if (confirmAToken) {
          req.userId = confirmAToken.userId;
          //return cb("Problem occured!", "images");
        }
      } catch (e) {}

      if (!refreshToken) {
        return cb("No refresh token!", "images");
      }

      let confirmRToken;

      try {
        confirmRToken = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );

        if (!confirmRToken) {
          if (refreshToken) {
            const existingRToken = await Token.findOne({ value: refreshToken });
            if (existingRToken) {
              await Token.deleteOne({ value: refreshToken });
              return cb("Faulty refresh token!", "images");
            }
          }
        }
      } catch (e) {
        return cb("Refresh token authentication failed!", "images");
      }

      const existingRToken = await Token.findOne({ value: refreshToken });
      if (!existingRToken) {
        console.log("Non-existant refresh token!");
        return cb("Non-existant refresh token!", "images");
      }
      req.userId = existingRToken.userId;

      cb(null, "images");
    },
    filename: (req, file, cb) => {
      cb(null, v4() + "-" + file.originalname);
    },
  });

  const fileFilter = async (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

  app.use(
    cors({
      credentials: true,
      origin: "http://localhost:3000",
    })
  );

  app.use(express.json());
  app.use(cookieParser());
  dotenv.config();

  app.use(async (req, res, next) => {
    let accessToken = "";
    let refreshToken = "";

    if (req.headers.cookie) {
      let cookies = req.headers.cookie.split(";");
      let refined = [];
      cookies.forEach((el) => {
        refined.push(el.split("="));
      });

      for (let i = 0; i < refined.length; i++) {
        for (let j = 0; j < refined[i].length; j++) {
          refined[i][j] = refined[i][j].trim(" ");
          if (refined[i][j] == "access-token") {
            accessToken = refined[i][j + 1];
          }
          if (refined[i][j] == "refresh-token") {
            refreshToken = refined[i][j + 1];
          }
        }
      }
    }

    //check if both tokens are missing
    if (!refreshToken && !accessToken) {
      return next();
    }

    //Check if the access token is still active
    try {
      const confirmAToken = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET
      );

      //if access token is valid, continue
      if (confirmAToken) {
        req.userId = confirmAToken.userId;
        return next();
      }
    } catch (e) {}

    //check to see if there is a refresh token
    if (!refreshToken) {
      return next();
    }

    let confirmRToken;

    //Check if the refresh token is valid and if not - exit
    try {
      confirmRToken = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      if (!confirmRToken) {
        if (refreshToken) {
          const existingRToken = await Token.findOne({ value: refreshToken });
          if (existingRToken) {
            await Token.deleteOne({ value: refreshToken });
            return next();
          }
        }
      }
    } catch (e) {
      return next();
    }

    //Find the user in case new tokens must be created
    //const user = await User.findOne({ _id: confirmRToken.userId });

    //Check if the refresh token is not only valid but in the DB, in case
    //a fake token is provided
    const existingRToken = await Token.findOne({ value: refreshToken });
    if (!existingRToken) {
      console.log("Non-existant refresh token!");
      return next();
    }
    req.userId = existingRToken.userId;

    //If the token is in the DB and is valid
    if (existingRToken) {
      //const newTokens = createTokens(existingRToken.userId);
      const newAccessToken = jwt.sign(
        {
          userId: confirmRToken.userId,
          email: confirmRToken.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      res.cookie("access-token", newAccessToken, {
        maxAge: 60 * 1000 * 15,
      });
    }

    next();
  });

  app.use("/images", express.static(path.join(__dirname, "images")));

  app.put(
    "/post-image",
    multer({ storage: fileStorage, fileFilter: fileFilter }).array("image", 10),
    async (req, res, next) => {
      if (!req.userId) {
        throw new Error("Not authenticated!");
      }
      if (!req.body) {
        return res.status(200).json({ message: "No file provided!" });
      }

      let linksArray = [];
      for(let i = 0; i < req.files.length;i++){
        linksArray.push(process.env.systemURL + req.files[i].path.replace(/\\/g, "//"))
      }

      return res
        .status(201)
        .json({ message: "File stored!", links: linksArray });
    }
  );

  app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
  });

  const apollo = new ApolloServer({
    typeDefs,
    resolvers: {
      Query,
      Mutation,
    },
    context: ({ req, res }) => {
      res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
      return { req, res };
    },
  });

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
      const io = require("./socket").init(server);
      io.on("connection", (socket) => {

      });
    })
    .catch((err) => console.log(err));
})();
