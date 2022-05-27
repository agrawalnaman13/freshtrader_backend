const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const validator = require("validator");
const { success, error } = require("../../service_response/adminApiResponse");
const SellerPOSLayout = require("../../Models/SellerModels/posLayoutSchema");
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
    const layout = await SellerPOSLayout.findOne({
      seller: ourSeller._id,
    });
    if (!layout) {
      const category = [
        {
          category: "Fruits",
          alias: "Fruits",
        },
        {
          category: "Vegetables",
          alias: "Vegetables",
        },
        {
          category: "Herbs",
          alias: "Herbs",
        },
        {
          category: "Others",
          alias: "Others",
        },
      ];
      await SellerPOSLayout.create({
        category: category,
        seller: ourSeller._id,
      });
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

exports.updateProfile = async (req, res, next) => {
  try {
    const {
      business_trading_name,
      abn,
      entity_name,
      address,
      phone_number,
      market,
      stall_location,
      smcs_code,
    } = req.body;
    console.log(req.body);
    if (!business_trading_name) {
      return res
        .status(200)
        .json(error("Please provide business trading name", res.statusCode));
    }
    if (!phone_number) {
      return res
        .status(200)
        .json(error("Please provide phone number", res.statusCode));
    }
    if (!abn) {
      return res.status(200).json(error("Please provide abn", res.statusCode));
    }
    if (!entity_name) {
      return res
        .status(200)
        .json(error("Please provide entity name", res.statusCode));
    }
    if (!address) {
      return res
        .status(200)
        .json(error("Please provide address", res.statusCode));
    }
    if (!market) {
      return res
        .status(200)
        .json(error("Please provide your market", res.statusCode));
    }
    if (!stall_location) {
      return res
        .status(200)
        .json(error("Please provide stall location", res.statusCode));
    }
    if (!smcs_code) {
      return res
        .status(200)
        .json(error("Please provide smcs code", res.statusCode));
    }

    const newSeller = await Wholeseller.findOneAndUpdate(
      { _id: req.seller._id },
      {
        business_trading_name: business_trading_name,
        abn: abn,
        entity_name: entity_name,
        address: address,
        phone_number: phone_number,
        market: market,
        stall_location: stall_location,
        smcs_code: smcs_code,
      }
    );
    res
      .status(200)
      .json(
        success(
          "Profile Updated Successfully",
          { seller: newSeller },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updateSellerPassword = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(req.body);
  if (!email) {
    return res.status(200).json(error("Please provide email", res.statusCode));
  }
  if (!validator.isEmail(email))
    return res.status(200).json(error("Invalid Email", res.statusCode));
  try {
    const ourSeller = await Wholeseller.findOne({ email });
    if (!ourSeller) {
      return res.status(200).json(error("Invalid email", res.statusCode));
    }
    ourSeller.password = password;
    await ourSeller.save();
    res
      .status(200)
      .json(
        success(
          "Profile Updated Successfully",
          { seller: ourSeller },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updateAccountInformation = async (req, res, next) => {
  const { account_name, bsb, account, sales_invoice_due_date, csv } = req.body;
  console.log(req.body);
  try {
    const newSeller = await Wholeseller.findOneAndUpdate(
      { _id: req.seller._id },
      {
        account_name: account_name,
        bsb: bsb,
        account: account,
        sales_invoice_due_date: sales_invoice_due_date,
        csv: csv,
      }
    );

    res
      .status(200)
      .json(
        success(
          "Account Information Updated Successfully",
          { seller: newSeller },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updateSellerDocuments = async (req, res, next) => {
  const { include_food_saftey_logo, receipt, a4 } = req.body;
  console.log(req.body);
  try {
    let query = {
      include_food_saftey_logo: include_food_saftey_logo,
    };
    if (receipt)
      query.thermal_receipt_invoice_logo = `${req.files[0].destination.replace(
        "./public",
        ""
      )}/${req.files[0].filename}`;
    if (a4) {
      let file = req.files[0];
      if (req.files.length === 2) file = req.files[0];
      query.a4_invoice_logo = `${file.destination.replace("./public", "")}/${
        file.filename
      }`;
    }
    const newSeller = await Wholeseller.findOneAndUpdate(
      { _id: req.seller._id },
      query
    );

    res
      .status(200)
      .json(
        success(
          "Account Information Updated Successfully",
          { seller: newSeller },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getSellerData = async (req, res, next) => {
  try {
    const ourSeller = await Wholeseller.findById(req.seller._id);
    if (!ourSeller) {
      return res.status(200).json(error("Invalid email", res.statusCode));
    }
    res
      .status(200)
      .json(
        success(
          "Seller data fetched successfully",
          { seller: ourSeller },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
