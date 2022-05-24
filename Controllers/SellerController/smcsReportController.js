const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const Transaction = require("../../Models/SellerModels/transactionSchema");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
exports.getSMCSReport = async (req, res, next) => {
  try {
    const { from, till, download } = req.body;
    const transactions = await Transaction.aggregate([
      {
        $project: {
          seller: 1,
          buyer: 1,
          total: 1,
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
        $match: {
          "buyer.is_smcs": true,
          $and: [
            from
              ? {
                  $and: [
                    { year: { $gte: new Date(from).getFullYear() } },
                    { month: { $gte: new Date(from).getMonth() + 1 } },
                    { day: { $gte: new Date(from).getDate() } },
                  ],
                }
              : {},
            till
              ? {
                  $and: [
                    { year: { $lte: new Date(till).getFullYear() } },
                    { month: { $lte: new Date(till).getMonth() + 1 } },
                    { day: { $lte: new Date(till).getDate() } },
                  ],
                }
              : {},
          ],
        },
      },
      {
        $group: {
          _id: {
            buyer: "$buyer",
          },
          total: { $sum: "$total" },
        },
      },
    ]);
    let report = [];
    for (const transaction of transactions) {
      report.push({
        buyer: transaction._id.buyer,
        total: transaction.total,
      });
    }
    const total = transactions.reduce(function (a, b) {
      return a + b.total;
    }, 0);
    const smcs_code = report.reduce(function (a, b) {
      console.log(a, b.buyer?.smcs_code);
      return a + +b.buyer?.smcs_code;
    }, 0);
    if (download) {
      const dirPath = path.join(
        __dirname.replace("SellerController", "templates"),
        "/smcs_report.html"
      );
      const template = fs.readFileSync(dirPath, "utf8");
      var data = {
        name: "Akashdeep",
        hobbies: ["playing football", "playing chess", "cycling"],
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
            res.download(res1.filename);
          }
        );
    } else {
      res
        .status(200)
        .json(
          success(
            "Report fetched Successfully",
            { report, total, smcs_code },
            res.statusCode
          )
        );
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
