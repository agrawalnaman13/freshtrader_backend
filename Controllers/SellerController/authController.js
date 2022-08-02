const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const validator = require("validator");
const { success, error } = require("../../service_response/adminApiResponse");
const SellerPOSLayout = require("../../Models/SellerModels/posLayoutSchema");
const SellerStaff = require("../../Models/SellerModels/staffSchema");
const Activity = require("../../Models/SellerModels/activitySchema");
exports.login = async (req, res, next) => {
  const { email, password, deviceId } = req.body;
  console.log(req.body);
  if (!email || !password) {
    return res
      .status(200)
      .json(error("Please provide both email and password", res.statusCode));
  }
  // if (!validator.isEmail(email))
  //   return res.status(200).json(error("Invalid Email", res.statusCode));
  try {
    const ourSeller = await Wholeseller.findOne({ email }).select("+password");
    if (!ourSeller) {
      const ourStaff = await SellerStaff.findOne({ username: email }).select(
        "+password"
      );
      if (ourStaff) {
        if (!(await ourStaff.correctPassword(password, ourStaff.password))) {
          return res
            .status(200)
            .json(error("Invalid Password", res.statusCode));
        }
        const seller = await Wholeseller.findById(ourStaff.seller).select(
          "+password"
        );
        if (!seller.status) {
          return res
            .status(200)
            .json(error("You are not authorized to log in", res.statusCode));
        }
        if (deviceId) seller.deviceId = deviceId;
        await seller.save();
        const token = await seller.generateAuthToken();
        return res
          .header("x-auth-token", token)
          .header("access-control-expose-headers", "x-auth-token")
          .status(200)
          .json(
            success(
              "Logged In Successfully",
              { seller: seller, staff: ourStaff, token: token },
              res.statusCode
            )
          );
      }
      return res.status(200).json(error("Invalid email", res.statusCode));
    }
    if (!ourSeller.status) {
      return res
        .status(200)
        .json(error("You are not authorized to log in", res.statusCode));
    }
    if (!(await ourSeller.correctPassword(password, ourSeller.password))) {
      return res.status(200).json(error("Invalid Password", res.statusCode));
    }
    // const layout = await SellerPOSLayout.findOne({
    //   seller: ourSeller._id,
    // });
    // if (!layout) {
    //   const category = [
    //     {
    //       category: "Fruits",
    //       alias: "Fruits",
    //     },
    //     {
    //       category: "Vegetables",
    //       alias: "Vegetables",
    //     },
    //     {
    //       category: "Herbs",
    //       alias: "Herbs",
    //     },
    //     {
    //       category: "Others",
    //       alias: "Others",
    //     },
    //   ];
    //   await SellerPOSLayout.create({
    //     category: category,
    //     seller: ourSeller._id,
    //   });
    // }
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
      address_line1,
      address_line2,
      city,
      postal_code,
      country,
      phone_number,
      market,
      stall_location,
      smcs_code,
      staff,
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
    if (!address_line1) {
      return res
        .status(200)
        .json(error("Please provide address line1", res.statusCode));
    }
    if (!address_line2) {
      return res
        .status(200)
        .json(error("Please provide address line2", res.statusCode));
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
    if (!this.checkABN(+abn)) {
      return res.status(200).json(error("Invalid ABN", res.statusCode));
    }
    const newSeller = await Wholeseller.findOneAndUpdate(
      { _id: req.seller._id },
      {
        business_trading_name: business_trading_name,
        abn: abn,
        entity_name: entity_name,
        address_line1: address_line1,
        address_line2: address_line2,
        city: city,
        postal_code: postal_code,
        country: country,
        phone_number: phone_number,
        market: market,
        stall_location: stall_location,
        smcs_code: smcs_code,
      }
    );
    let query = {
      seller: req.seller._id,
      event: "Account Edit",
      info: [`Profile Edited`],
    };
    if (staff) query.account = staff;
    await Activity.create(query);
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
  const { email, password, staff } = req.body;
  console.log(req.body);
  if (!email) {
    return res.status(200).json(error("Please provide email", res.statusCode));
  }
  if (!validator.isEmail(email))
    return res.status(200).json(error("Invalid Email", res.statusCode));
  if (!password) {
    return res
      .status(200)
      .json(error("Please provide password", res.statusCode));
  }
  try {
    const ourSeller = await Wholeseller.findOne({ email });
    if (!ourSeller) {
      return res.status(200).json(error("Invalid email", res.statusCode));
    }
    ourSeller.password = password;
    await ourSeller.save();
    let query = {
      seller: req.seller._id,
      event: "Account Edit",
      info: [`Password Edited`],
    };
    if (staff) query.account = staff;
    await Activity.create(query);
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
  try {
    const {
      account_name,
      bsb,
      account,
      sales_invoice_due_date,
      csv,
      smcs_invoice_account_code,
      invoice_account_code,
      cash_account_code,
      card_account_code,
      credit_note_account_code,
      staff,
    } = req.body;
    console.log(req.body);
    if (!account_name) {
      return res
        .status(200)
        .json(error("Please provide account name", res.statusCode));
    }
    if (!bsb) {
      return res.status(200).json(error("Please provide bsb", res.statusCode));
    }
    if (!account) {
      return res
        .status(200)
        .json(error("Please provide account", res.statusCode));
    }
    if (!sales_invoice_due_date) {
      return res
        .status(200)
        .json(error("Please provide sales invoice due date", res.statusCode));
    }
    if (!csv) {
      return res.status(200).json(error("Please provide csv", res.statusCode));
    }
    if (!["Xero", "MYOB", "Saasu", "Quickbooks"].includes(csv)) {
      return res.status(200).json(error("Invalid csv", res.statusCode));
    }
    const newSeller = await Wholeseller.findOneAndUpdate(
      { _id: req.seller._id },
      {
        account_name: account_name,
        bsb: bsb,
        account: account,
        sales_invoice_due_date: +sales_invoice_due_date,
        csv: csv,
        smcs_invoice_account_code: smcs_invoice_account_code,
        invoice_account_code: invoice_account_code,
        cash_account_code: cash_account_code,
        card_account_code: card_account_code,
        credit_note_account_code: credit_note_account_code,
      }
    );
    let query = {
      seller: req.seller._id,
      event: "Account Edit",
      info: [`Account Information Edited`],
    };
    if (staff) query.account = staff;
    await Activity.create(query);
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

exports.updateOrderSetting = async (req, res, next) => {
  try {
    const { public_ordering, publish_prices, staff } = req.body;
    console.log(req.body);
    if (public_ordering === "" || public_ordering === undefined) {
      return res
        .status(200)
        .json(error("Please provide public ordering", res.statusCode));
    }
    if (publish_prices === "" || publish_prices === undefined) {
      return res
        .status(200)
        .json(error("Please provide publish prices", res.statusCode));
    }
    const newSeller = await Wholeseller.findOneAndUpdate(
      { _id: req.seller._id },
      {
        public_ordering,
        publish_prices,
      }
    );
    let query = {
      seller: req.seller._id,
      event: "Account Edit",
      info: [`Order Setting Edited`],
    };
    if (staff) query.account = staff;
    await Activity.create(query);
    res
      .status(200)
      .json(
        success(
          "Order Setting Updated Successfully",
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
  const { include_food_saftey_logo, receipt, a4, staff } = req.body;
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
    query = {
      seller: req.seller._id,
      event: "Account Edit",
      info: [`Receipt & Invoice Settings Edited`],
    };
    if (staff) query.account = staff;
    await Activity.create(query);
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

exports.checkABN = (abn) => {
  try {
    abn -= 10000000000;
    const weighting = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    let sum = 0;
    for (var i = 0; i < String(abn).length; i++) {
      sum += +String(abn)[i] * weighting[i];
    }
    if (sum % 89 === 0) return true;
    else return false;
  } catch (err) {
    console.log(err);
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
    const seller = await Wholeseller.findOne({ email });
    if (!seller) {
      return res
        .status(200)
        .json(error("Email is not registered", res.statusCode));
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
    await Wholeseller.findOneAndUpdate({ email }, { otp: otp });
    res.status(200).json(success(otp, { otp }, res.statusCode));
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
    const seller = await Wholeseller.findOne({ email });
    if (!seller) {
      return res
        .status(200)
        .json(error("Email is not registered", res.statusCode));
    }
    if (seller.otp !== +otp) {
      return res.status(200).json(error("Invalid OTP", res.statusCode));
    }
    await Wholeseller.findOneAndUpdate({ email }, { otp: "" });
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
    const seller = await Wholeseller.findOne({ email }).select("+password");
    if (!seller) {
      return res
        .status(200)
        .json(error("Email is not registered", res.statusCode));
    }
    seller.password = password;
    await seller.save();
    res
      .status(200)
      .json(
        success("Password Updated Successfully", { seller }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
