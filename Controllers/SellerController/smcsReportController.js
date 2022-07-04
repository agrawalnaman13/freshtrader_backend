const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const Transaction = require("../../Models/SellerModels/transactionSchema");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const sendMail = require("../../services/mail");
const SMCSReport = require("../../Models/SellerModels/smcsReportSchema");
exports.getSMCSReport = async (req, res, next) => {
  try {
    const { week, year, download } = req.body;
    let firstDay, lastDay;
    console.log(week && year);
    if (week && year) {
      const d = new Date("Jan 01, " + year + " 01:00:00");
      const w = d.getTime() + 604800000 * (week - 1);
      firstDay = new Date(w);
      lastDay = new Date(w + 518400000);
    } else {
      const curr = new Date();
      const first = curr.getDate() - curr.getDay();
      const last = first + 6;
      firstDay = new Date(curr.setDate(first)).toUTCString();
      lastDay = new Date(curr.setDate(last)).toUTCString();
    }
    console.log(firstDay, lastDay);
    const transactions = await Transaction.aggregate([
      {
        $project: {
          seller: 1,
          buyer: 1,
          total: 1,
          is_smcs: 1,
          createdAt: 1,
          year: {
            $year: "$createdAt",
          },
          month: {
            $month: "$createdAt",
          },
          day: {
            $dayOfMonth: "$createdAt",
          },
        },
      },
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
          is_smcs: true,
          $and: [
            { year: { $gte: new Date(firstDay).getFullYear() } },
            { month: { $gte: new Date(firstDay).getMonth() + 1 } },
            { day: { $gte: new Date(firstDay).getDate() } },
            { year: { $lte: new Date(lastDay).getFullYear() } },
            { month: { $lte: new Date(lastDay).getMonth() + 1 } },
            { day: { $lte: new Date(lastDay).getDate() } },
          ],
        },
      },
      {
        $lookup: {
          localField: "buyer",
          foreignField: "_id",
          from: "buyers",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },
      {
        $group: {
          _id: {
            buyer: "$buyer",
          },
          total: { $sum: "$total" },
          transactionIds: { $addToSet: "$_id" },
        },
      },
    ]);
    let report = [];
    for (const transaction of transactions) {
      report.push({
        buyer: transaction._id.buyer,
        transactionIds: transaction.transactionIds,
        total: transaction.total,
      });
    }
    const total = transactions.reduce(function (a, b) {
      return a + b.total;
    }, 0);
    const smcs_code = report.reduce(function (a, b) {
      return a + +b.buyer.smcs_code;
    }, 0);
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    const smcs = await SMCSReport.findOne({
      seller: req.seller._id,
      week: week ? week : weekNumber,
      year: year ? year : currentDate.getFullYear(),
    });
    if (download) {
      console.log(__dirname);
      const dirPath = path.join(
        __dirname.replace("SellerController", "templates"),
        "/smcs_report.html"
      );
      const template = fs.readFileSync(dirPath, "utf8");
      var data = {
        css: `${process.env.BASE_URL}/css/style.css`,
        logo: `${process.env.BASE_URL}/logo.png`,
        list: report,
      };
      var html = ejs.render(template, { data: data });
      var options = { format: "Letter" };
      pdf
        .create(html, options)
        .toFile(
          `./public/sellers/${req.seller._id}/smcs_report.pdf`,
          function (err, res1) {
            if (err) return console.log(err);
            console.log(res1);
            res.status(200).json(
              success(
                "Report fetched Successfully",
                {
                  file: `${process.env.BASE_URL}/sellers/${req.seller._id}/smcs_report.pdf`,
                },
                res.statusCode
              )
            );
          }
        );
    } else {
      res
        .status(200)
        .json(
          success(
            "Report fetched Successfully",
            { report, total, smcs_code, smcs_notified: smcs ? true : false },
            res.statusCode
          )
        );
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.emailSMCS = async (req, res, next) => {
  try {
    const { week, year, transactionIds } = req.body;
    if (!week) {
      return res.status(200).json(error("Please provide week", res.statusCode));
    }
    if (!year) {
      return res.status(200).json(error("Please provide year", res.statusCode));
    }
    if (!transactionIds.length) {
      return res
        .status(200)
        .json(error("Transactions are required", res.statusCode));
    }
    const smcs = await SMCSReport.findOne({
      seller: req.seller._id,
      week,
      year,
    });
    if (smcs) {
      return res
        .status(200)
        .json(error("SMCS is already notified", res.statusCode));
    }
    const newTransactionIds = transactionIds.map((id) => {
      return mongoose.Types.ObjectId(id);
    });
    const transactions = await Transaction.aggregate([
      {
        $match: {
          _id: { $in: newTransactionIds },
        },
      },
      {
        $lookup: {
          localField: "buyer",
          foreignField: "_id",
          from: "buyers",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },
    ]);
    const dirPath = path.join(
      __dirname.replace("SellerController", "templates"),
      "/smcs_report.html"
    );
    const template = fs.readFileSync(dirPath, "utf8");
    var data = {
      css: `${process.env.BASE_URL}/css/style.css`,
      logo: `${process.env.BASE_URL}/logo.png`,
      list: transactions,
    };
    var html = ejs.render(template, { data: data });
    var options = { format: "Letter" };
    pdf
      .create(html, options)
      .toFile(
        `./public/sellers/${req.seller._id}/smcs_report.pdf`,
        function (err, res1) {
          if (err) return console.log(err);
          console.log(res1);
        }
      );

    await SMCSReport.create({
      seller: req.seller._id,
      week,
      year,
      emailed_on: new Date(Date.now()),
    });
    for (const transaction of transactionIds) {
      await Transaction.findByIdAndUpdate(transaction, {
        smcs_notified: true,
      });
    }
    res
      .status(200)
      .json(success("Email Sent Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
