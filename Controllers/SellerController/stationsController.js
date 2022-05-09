const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const SellerStation = require("../../Models/SellerModels/sellerStationSchema");

exports.addStation = async (req, res, next) => {
  try {
    const { station } = req.body;
    console.log(req.body);
    if (!station) {
      return res
        .status(200)
        .json(error("Please provide station", res.statusCode));
    }
    const sellerStation = await SellerStation.create({
      seller: req.seller._id,
      station: station,
    });
    res
      .status(200)
      .json(
        success("Station Added Successfully", { sellerStation }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.addDevice = async (req, res, next) => {
  try {
    const { stationId, device } = req.body;
    console.log(req.body);
    if (!stationId) {
      return res
        .status(200)
        .json(error("Please provide station", res.statusCode));
    }
    const sellerStation = await SellerStation.findById(stationId);
    sellerStation.devices.push(device);
    await sellerStation.save();
    res
      .status(200)
      .json(
        success("Device Added Successfully", { sellerStation }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getStations = async (req, res, next) => {
  try {
    const sellerStation = await SellerStation.find({
      seller: req.seller._id,
    });
    res
      .status(200)
      .json(
        success(
          "Station Fetched Successfully",
          { sellerStation },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
