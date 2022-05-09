const jwt = require("jsonwebtoken");
const config = require("config");
const { error } = require("../service_response/adminApiResponse");
function tokenAuthorisation(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token)
    return res
      .status(401)
      .json(error("Access Denied. No token provided.", res.statusCode));
  try {
    const decoded = jwt.verify(token, "ultra-security");
    req.seller = decoded;
    next();
  } catch (ex) {
    return res
      .status(400)
      .json(error("You are not Authenticated Yet", res.statusCode));
  }
}
module.exports = tokenAuthorisation;
