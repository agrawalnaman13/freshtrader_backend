const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const SellerStation = require("../../Models/SellerModels/sellerStationSchema");
const crypto = require("crypto");
const squareConnect = require("square-connect");
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
    const { stationId, a4_printer, thermal_printer, card_reader } = req.body;
    console.log(req.body);
    if (!stationId) {
      return res
        .status(200)
        .json(error("Please provide station", res.statusCode));
    }
    const sellerStation = await SellerStation.findById(stationId);
    if (!sellerStation) {
      return res.status(200).json(error("Invalid station Id", res.statusCode));
    }
    const updatedSellerStation = await SellerStation.findByIdAndUpdate(
      stationId,
      {
        a4_printer,
        thermal_printer,
        card_reader,
      }
    );
    res
      .status(200)
      .json(
        success(
          "Device Updated Successfully",
          { sellerStation: updatedSellerStation },
          res.statusCode
        )
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

exports.payment = async (req, res, next) => {
  const defaultClient = squareConnect.ApiClient.instance;
  const oauth2 = defaultClient.authentications["oauth2"];
  oauth2.accessToken =
    "EAAAED9gy6OacBTBqIWQ74lrtRkyg9co2Y8FxihP5gdpkNzR6VqynvS80iBMKJFx";
  defaultClient.basePath = "https://connect.squareupsandbox.com";
  const request_params = req.body;

  // length of idempotency_key should be less than 45
  const idempotency_key = crypto.randomBytes(22).toString("hex");

  // Charge the customer's card
  const payments_api = new squareConnect.PaymentsApi();
  const request_body = {
    source_id: request_params.nonce,
    amount_money: {
      amount: 100, // £1.00 charge
      currency: "USD",
    },
    idempotency_key: idempotency_key,
  };

  try {
    const response = await payments_api.createPayment(request_body);
    res.status(200).json({
      title: "Payment Successful",
      result: response,
    });
  } catch (error) {
    res.status(500).json({
      title: "Payment Failure",
      result: error.response.text,
    });
  }
};
