const mongoose = require("mongoose");
const Activity = require("../../Models/SellerModels/activitySchema");
const SellerStaff = require("../../Models/SellerModels/staffSchema");
const { success, error } = require("../../service_response/adminApiResponse");

exports.getActivityLog = async (req, res, next) => {
  try {
    const { from, till, sortBy, filterBy, search } = req.body;
    const activities = await Activity.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
          $and: [
            from ? { createdAt: { $gte: new Date(from) } } : {},
            till ? { createdAt: { $lte: new Date(till) } } : {},
            filterBy === 1 ? { event: "Transaction Edit" } : {},
            filterBy === 2 ? { event: "Account Edit" } : {},
            filterBy === 3 ? { event: "Customer File Edit" } : {},
            filterBy === 4 ? { event: "Transaction Processed" } : {},
            filterBy === 5 ? { event: "Consignment Created" } : {},
            filterBy === 6 ? { event: "Consignment Edit" } : {},
            filterBy === 7 ? { event: "SMCS Sent" } : {},
            search
              ? {
                  $or: [
                    {
                      event: {
                        $regex: search,
                        $options: "$i",
                      },
                    },
                    {
                      info: {
                        $regex: search,
                        $options: "$i",
                      },
                    },
                  ],
                }
              : {},
          ],
        },
      },
      {
        $sort:
          sortBy === 1
            ? { createdAt: -1 }
            : sortBy === 2
            ? { createdAt: 1 }
            : { createdAt: -1 },
      },
    ]);

    for (const activity of activities) {
      if (activity.account)
        activity.account = await SellerStaff.findById(activity.account);
      else activity.account = {};
      if (activity.salesman)
        activity.salesman = await SellerStaff.findById(activity.salesman);
      else activity.salesman = {};
    }
    if (sortBy === 3)
      activities.sort((a, b) =>
        a.salesman.username > b.salesman.username
          ? 1
          : b.salesman.username > a.salesman.username
          ? -1
          : 0
      );
    if (sortBy === 4)
      activities.sort((a, b) =>
        a.account.username > b.account.username
          ? 1
          : b.account.username > a.account.username
          ? -1
          : 0
      );

    res
      .status(200)
      .json(
        success(
          "Activity Log Fetched Successfully",
          { activities },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
