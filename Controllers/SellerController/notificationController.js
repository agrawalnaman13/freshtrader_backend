const { success, error } = require("../../service_response/adminApiResponse");
exports.login = async (req, res, next) => {
  try {
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
