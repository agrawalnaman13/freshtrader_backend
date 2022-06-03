const mongoose = require("mongoose");
const SellerStaff = require("../../Models/SellerModels/staffSchema");
const { success, error } = require("../../service_response/adminApiResponse");

exports.addStaff = async (req, res, next) => {
  try {
    const { first_name, last_name, username, password, phone_number, access } =
      req.body;
    console.log(req.body);
    if (!username) {
      return res
        .status(200)
        .json(error("Please provide user name", res.statusCode));
    }
    if (!password) {
      return res
        .status(200)
        .json(error("Please provide password", res.statusCode));
    }
    if (!access.length) {
      return res
        .status(200)
        .json(error("Please provide access", res.statusCode));
    }
    const staff = await SellerStaff.create({
      seller: req.seller._id,
      first_name,
      last_name,
      username,
      password,
      phone_number,
      access,
    });
    await staff.save();
    res
      .status(200)
      .json(success("Staff Added Successfully", { staff }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getStaff = async (req, res, next) => {
  try {
    const staffs = await SellerStaff.find({
      seller: req.seller._id,
    });
    res
      .status(200)
      .json(success("Staff Fetched Successfully", { staffs }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getStaffDetail = async (req, res, next) => {
  try {
    const staff = await SellerStaff.findById(req.params.id);
    if (!staff) {
      return res.status(200).json(error("staff not found", res.statusCode));
    }
    res
      .status(200)
      .json(success("Staff Fetched Successfully", { staff }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const {
      staffId,
      first_name,
      last_name,
      username,
      password,
      phone_number,
      access,
    } = req.body;
    console.log(req.body);
    if (!staffId) {
      return res
        .status(200)
        .json(error("Please provide staff id", res.statusCode));
    }
    const staff = await SellerStaff.findById(staffId);
    if (!staff) {
      return res.status(200).json(error("staff not found", res.statusCode));
    }
    if (!username) {
      return res
        .status(200)
        .json(error("Please provide user name", res.statusCode));
    }
    if (!access.length) {
      return res
        .status(200)
        .json(error("Please provide access", res.statusCode));
    }
    staff.first_name = first_name;
    staff.last_name = last_name;
    staff.username = username;
    staff.phone_number = phone_number;
    staff.access = access;
    if (password) staff.password = password;
    await staff.save();
    res
      .status(200)
      .json(success("Staff Updated Successfully", { staff }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
