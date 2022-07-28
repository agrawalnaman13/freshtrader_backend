const { success, error } = require("../../service_response/adminApiResponse");
const admin = require("firebase-admin");
const serviceAccount = require("../../config/firebase.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://freshtrader-78321-default-rtdb.firebaseio.com",
});
exports.sendNotification = async (type, name, data) => {
  try {
    const notification_options = {
      priority: "high",
      timeToLive: 60 * 60 * 24,
    };

    let title = "";
    let body = "";
    if (type === "Counter") {
      body = `${name} sent a counter offer`;
      title = "Counter Offer";
    } else if (type === "Confirm") {
      body = `${name} confirmed your order`;
      title = "Order Confirmed";
    } else if (type === "Cancel") {
      body = `${name} canceled your order`;
      title = "Order Canceled";
    } else if (type === "Decline") {
      body = `${name} canceled his order`;
      title = "Order Canceled";
    } else if (type === "New Order") {
      body = `You received a new order from ${name}`;
      title = "New Order";
    } else if (type === "Cancel Counter") {
      body = `${name} canceled your counter offer`;
      title = "Offer Canceled";
    }
    const payload = {
      notification: {
        title: title,
        body: body,
        sound: "default",
        icon: "https://www.maidsstage.com/assets/images/logovendor.png",
      },
      data: { ...data },
    };
    admin
      .messaging()
      .sendToDevice(
        "cCjfaJCYPtY8-Jb5LuYOOA:APA91bEkkIwEpC0ExSuN3Jx1-Bp2CDXBQ_7QAO4t6crH83n2Om8F4B5hPViDsl9NPYKeYW8Z4WSNhzCruuNlhU-vANm2e8pKpYjjo7ukDx8Ck_2ssEl7Np02r-B8wFOEpK6HrooV3u2X",
        payload,
        notification_options
      )
      .then((response) => {
        console.log(response.results);
        return;
      })
      .catch((error) => {
        console.log(error);
      });
    return;
  } catch (err) {
    console.log(err);
    return;
  }
};
