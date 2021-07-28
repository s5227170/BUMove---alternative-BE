const jwt = require("jsonwebtoken");
const Token = require("../models/token");

module.exports = createTokens = async (user) => {
    const refreshToken = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      const RT = new Token({
          value: refreshToken
      })
  
      const addedToken = await RT.save();
  
      const accessToken = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      return {addedToken, accessToken}
}