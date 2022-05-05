const mongoose = require("mongoose");
const { success, error } = require("../service_response/adminApiResponse");
const validator = require("validator");
const Wholeseller = require("../Models/AdminModels/wholesellerSchema");

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(req.body);
  if (!email || !password) {
    return res
      .status(200)
      .json(error("Please provide both email and password", res.statusCode));
  }
  if (!validator.isEmail(email))
    return res.status(200).json(error("Invalid Email", res.statusCode));
  try {
    const ourSeller = await Wholeseller.findOne({ email }).select("+password");
    if (!ourSeller) {
      return res.status(200).json(error("Invalid email", res.statusCode));
    }
    if (!(await ourSeller.correctPassword(password, ourSeller.password))) {
      return res.status(200).json(error("Invalid Password", res.statusCode));
    }
    const token = await ourSeller.generateAuthToken();
    res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .status(200)
      .json(
        success(
          "Logged In Successfully",
          { seller: ourSeller, token: token },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
