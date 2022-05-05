const multer = require("multer");
var fs = require("fs");
const {
  success,
  error,
  validation,
} = require("./../service_response/adminApiResponse");

//Check direcory if not exist it will create
const checkOrCreatePath = function (path, next) {
  if (!fs.existsSync(path)) {
    fs.mkdir(path, { recursive: true }, function (err) {
      console.log(err);
    });
  }
  return true;
};

//Check disk storage and upload image
function uploadImageNew(path) {
  const testStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `./public/Products`);
    },
    filename: function (req, file, cb) {
      req.file = file;
      let spilitName = file.originalname.split(".");

      let alphaNumericString = spilitName[0].replace(/[^a-zA-Z ]/g, "");
      let generateRandomString = (length = 6) =>
        Math.random().toString(20).substr(2, length);

      let updatedname =
        alphaNumericString +
        generateRandomString() +
        "-" +
        Date.now() +
        "." +
        spilitName[1];

      cb(null, updatedname);
      req.file.updatedname = updatedname;
    },
  });
  return testStorage;
}
// handle media file request
const uploadMediaTest = multer({
  storage: uploadImageNew("./public/Products"),
});

// common function to handle req and res
const uploadTestImage = async (req, res) => {
  try {
    console.log(req.file);
    const imagePath = "Products/" + `${req.file.updatedname}`;
    return res
      .status(200)
      .json(success("Success", { imagePath: imagePath }, res.statusCode));
  } catch (err) {
    console.error(err);
  }
};

module.exports = { checkOrCreatePath, uploadTestImage, uploadMediaTest };
