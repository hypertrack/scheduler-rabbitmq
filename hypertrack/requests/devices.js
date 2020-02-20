require("dotenv").config();
const request = require("request");
const _ = require("lodash");
const moment = require("moment");

function deleteOldDevices() {
  // get all devices using HyperTrack API
  const base64auth = Buffer.from(
    `${process.env.HT_ACCOUNT_ID}:${process.env.HT_SECRET_KEY}`
  ).toString("base64");
  const auth = `Basic ${base64auth}`;
  let options = {
    url: "https://v3.api.hypertrack.com/devices",
    headers: {
      Authorization: auth
    }
  };

  request(options, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const devices = JSON.parse(body);
      var deviceCollection = require("../models/device.model");
      let oldDevices = [];

      devices.forEach(device => {
        // create timestamps for comparison
        const lastUpdated = moment(device.device_status.data.recorded_at);
        const lastWeek = moment().subtract(1, "weeks");
        const lastTwoWeeks = moment().subtract(2, "weeks");

        // disconnected = 5 days
        if (
          device.device_status.value === "disconnected" &&
          lastUpdated.isBefore(lastWeek)
        ) {
          console.log(
            `****** DELETE DISCONNECTED DEVICE: ${
              device.name
            }. Last updated ${lastUpdated.fromNow()}`
          );
          deleteDevice(device.device_id);
          oldDevices.push(device.device_id);
        }

        // inactive = 30 days
        if (
          device.device_status.value === "inactive" &&
          lastUpdated.isBefore(lastTwoWeeks)
        ) {
          console.log(
            `****** DELETE INACTIVE DEVICE: ${
              device.name
            }. Last updated ${lastUpdated.fromNow()}`
          );
          deleteDevice(device.device_id);
          oldDevices.push(device.device_id);
        }
      });

      console.log(`****** DELETED ${oldDevices.length} DEVICES DURING CLEANUP`);
      deviceCollection.deleteMany({ device_id: oldDevices });
    }
  });
}

function deleteDevice(device_id) {
  const base64auth = Buffer.from(
    `${process.env.HT_ACCOUNT_ID}:${process.env.HT_SECRET_KEY}`
  ).toString("base64");
  const auth = `Basic ${base64auth}`;
  let options = {
    url: `https://v3.api.hypertrack.com/devices/${device_id}`,
    headers: {
      Authorization: auth
    }
  };

  request.delete(options);
}

function startTrackingAllDevices() {
  // get all devices using HyperTrack API
  const base64auth = Buffer.from(
    `${process.env.HT_ACCOUNT_ID}:${process.env.HT_SECRET_KEY}`
  ).toString("base64");
  const auth = `Basic ${base64auth}`;
  let options = {
    url: "https://v3.api.hypertrack.com/devices",
    headers: {
      Authorization: auth
    }
  };

  request(options, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const devices = JSON.parse(body);

      devices.forEach(device => {
        console.log(`****** START TRACKING: ${device.device_id}`);
        startTracking(device.device_id);
      });
    }
  });
}

function startTracking(device_id) {
  const base64auth = Buffer.from(
    `${process.env.HT_ACCOUNT_ID}:${process.env.HT_SECRET_KEY}`
  ).toString("base64");
  const auth = `Basic ${base64auth}`;
  let options = {
    url: `https://v3.api.hypertrack.com/devices/${device_id}/start`,
    headers: {
      Authorization: auth
    }
  };

  request.post(options);
}

function stopTrackingAllDevices() {
  // get all devices using HyperTrack API
  const base64auth = Buffer.from(
    `${process.env.HT_ACCOUNT_ID}:${process.env.HT_SECRET_KEY}`
  ).toString("base64");
  const auth = `Basic ${base64auth}`;
  let options = {
    url: "https://v3.api.hypertrack.com/devices",
    headers: {
      Authorization: auth
    }
  };

  request(options, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const devices = JSON.parse(body);

      devices.forEach(device => {
        console.log(`****** STOP TRACKING: ${device.device_id}`);
        stopTracking(device.device_id);
      });
    }
  });
}

function stopTracking(device_id) {
  const base64auth = Buffer.from(
    `${process.env.HT_ACCOUNT_ID}:${process.env.HT_SECRET_KEY}`
  ).toString("base64");
  const auth = `Basic ${base64auth}`;
  let options = {
    url: `https://v3.api.hypertrack.com/devices/${device_id}/stop`,
    headers: {
      Authorization: auth
    }
  };

  request.post(options);
}

module.exports = {
  stopTrackingAllDevices,
  startTrackingAllDevices,
  deleteOldDevices
};
