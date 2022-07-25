const { success, error } = require("../../service_response/adminApiResponse");
// const admin = require("firebase-admin");
// const serviceAccount = require("../../config/firebase.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://freshtrader-78321-default-rtdb.firebaseio.com",
// });
exports.sendNotification = async (req, res, next) => {
  try {
    const notification_options = {
      priority: "high",
      timeToLive: 60 * 60 * 24,
    };
    let title = "Testing";
    let body = "Hello";
    const payload = {
      notification: {
        title: title,
        body: body ? body : title,
        sound: "default",
        icon: "https://www.maidsstage.com/assets/images/logovendor.png",
      },
      data: {},
    };
    // admin
    //   .messaging()
    //   .sendToDevice(
    //     "cCjfaJCYPtY8-Jb5LuYOOA:APA91bEkkIwEpC0ExSuN3Jx1-Bp2CDXBQ_7QAO4t6crH83n2Om8F4B5hPViDsl9NPYKeYW8Z4WSNhzCruuNlhU-vANm2e8pKpYjjo7ukDx8Ck_2ssEl7Np02r-B8wFOEpK6HrooV3u2X",
    //     payload,
    //     notification_options
    //   )
    //   .then((response) => {
    //     console.log(response.results);
    //     return;
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   });
    return;
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
