const { success, error } = require("../../service_response/adminApiResponse");
const admin = require("firebase-admin");
const serviceAccount = require("../../config/firebase.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://freshtrader-78321-default-rtdb.firebaseio.com",
});
exports.sendNotification = async (type, name, data, deviceId) => {
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
      .sendToDevice(deviceId, payload, notification_options)
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
