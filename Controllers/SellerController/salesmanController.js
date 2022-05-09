const mongoose = require("mongoose");
const SellerSalesman = require("../../Models/SellerModels/sellerSalesmanSchema");
const { success, error } = require("../../service_response/adminApiResponse");

exports.addSalesman = async (req, res, next) => {
  try {
    const { nick_name, full_name } = req.body;
    console.log(req.body);
    if (!nick_name) {
      return res
        .status(200)
        .json(error("Please provide nick name", res.statusCode));
    }
    if (!full_name) {
      return res
        .status(200)
        .json(error("Please provide full name", res.statusCode));
    }
    const sellerSalesman = await SellerSalesman.create({
      seller: req.seller._id,
      nick_name: nick_name,
      full_name: full_name,
    });
    res
      .status(200)
      .json(
        success(
          "Salesman Added Successfully",
          { sellerSalesman },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getSalesman = async (req, res, next) => {
  try {
    const sellerSalesman = await SellerSalesman.find({
      seller: req.seller._id,
    });
    res
      .status(200)
      .json(
        success(
          "Salesman Fetched Successfully",
          { sellerSalesman },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.deleteSalesman = async (req, res, next) => {
  try {
    const salesman = await SellerSalesman.findById(req.params.id);
    if (!salesman) {
      return res.status(200).json(error("Salesman not found", res.statusCode));
    }
    await SellerSalesman.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json(success("Salesman Deleted Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
