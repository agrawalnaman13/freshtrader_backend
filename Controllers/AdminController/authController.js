const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const validator = require("validator");
const Admin = require("../../Models/AdminModels/adminSchema");
exports.adminSignup = async (req, res) => {
  try {
    const { email, full_name, password } = req.body;
    console.log(req.body);
    if (!email) {
      return res
        .status(200)
        .json(error("Please provide email", res.statusCode));
    }
    if (!full_name) {
      return res
        .status(200)
        .json(error("Please provide full name", res.statusCode));
    }
    if (!req.files.length) {
      return res
        .status(200)
        .json(error("Please provide profile image", res.statusCode));
    }
    if (!password) {
      return res
        .status(200)
        .json(error("Please provide password", res.statusCode));
    }

    const admin = await Admin.create({
      email: email,
      full_name: full_name,
      password: password,
      profile_image: `${req.files[0].destination.replace("./public", "")}/${
        req.files[0].filename
      }`,
    });
    await admin.save();
    res
      .status(200)
      .json(success("Profile Created Successfully", { admin }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

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
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res
        .status(200)
        .json(error("Email is not registered", res.statusCode));
    }
    if (!(await admin.correctPassword(password, admin.password))) {
      return res.status(200).json(error("Invalid Password", res.statusCode));
    }
    const token = await admin.generateAuthToken();
    res
      .header("x-auth-token-admin", token)
      .header("access-control-expose-headers", "x-auth-token-admin")
      .status(200)
      .json(
        success("Logged In Successfully", { admin, token }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getAdminData = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select("-password");
    res
      .status(200)
      .json(
        success("Admin Data Fetched Successfully", { admin }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  console.log(req.body);
  if (!email) {
    return res.status(200).json(error("Please provide email", res.statusCode));
  }
  if (!validator.isEmail(email))
    return res.status(200).json(error("Invalid Email", res.statusCode));
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res
        .status(200)
        .json(error("Email is not registered", res.statusCode));
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
    await Admin.findOneAndUpdate({ email }, { otp: otp });
    res.status(200).json(success("OTP Sent", { otp }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;
  console.log(req.body);
  if (!email) {
    return res.status(200).json(error("Please provide email", res.statusCode));
  }
  if (!validator.isEmail(email))
    return res.status(200).json(error("Invalid Email", res.statusCode));
  if (!otp) {
    return res.status(200).json(error("Please provide otp", res.statusCode));
  }
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res
        .status(200)
        .json(error("Email is not registered", res.statusCode));
    }
    if (admin.otp !== +otp) {
      return res.status(200).json(error("Invalid OTP", res.statusCode));
    }
    await Admin.findOneAndUpdate({ email }, { otp: "" });
    res.status(200).json(success("OTP Verified", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updatePassword = async (req, res, next) => {
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
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res
        .status(200)
        .json(error("Email is not registered", res.statusCode));
    }
    admin.password = password;
    await admin.save();
    res
      .status(200)
      .json(
        success("Password Updated Successfully", { admin }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    console.log(req.body);
    if (!oldPassword) {
      return res
        .status(200)
        .json(error("Please provide old password", res.statusCode));
    }
    if (!newPassword) {
      return res
        .status(200)
        .json(error("Please provide new password", res.statusCode));
    }
    const admin = await Admin.findById(req.admin._id).select("+password");
    if (!(await admin.correctPassword(oldPassword, admin.password))) {
      return res
        .status(200)
        .json(error("Invalid old Password", res.statusCode));
    }
    admin.password = newPassword;
    await admin.save();
    res
      .status(200)
      .json(
        success("Password Updated Successfully", { admin }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { full_name } = req.body;
    console.log(req.body);
    if (!full_name) {
      return res
        .status(200)
        .json(error("Please provide full name", res.statusCode));
    }
    const admin = await Admin.findById(req.admin._id);
    admin.full_name = full_name;
    if (req.files.length) {
      admin.profile_image = `${req.files[0].destination.replace(
        "./public",
        ""
      )}/${req.files[0].filename}`;
    }
    await admin.save();
    res
      .status(200)
      .json(success("Profile Updated Successfully", { admin }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
