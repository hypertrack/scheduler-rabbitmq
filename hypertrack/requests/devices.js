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
  // get all devices using HyperTrack API
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

function updateAllDevices() {
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
      let bulkOps = [];
      let upsertDoc = {};

      // update all devices in mongoDB
      var deviceCollection = require("../models/device.model");

      devices.forEach(device => {
        // filter out devices without a location
        if (_.get(device, "location.recorded_at", false)) {
          upsertDoc = {
            updateOne: {
              filter: { device_id: device["device_id"] },
              update: device,
              upsert: true,
              setDefaultsOnInsert: true
            }
          };
          bulkOps.push(upsertDoc);
        }
      });

      if (bulkOps.length > 0) {
        try {
          deviceCollection.bulkWrite(bulkOps).then(res => {
            console.log(
              `[Mongoose] - Updating all devices: ${res.modifiedCount} updated, ${res.insertedCount} added`
            );
          });
        } catch (e) {
          console.log(`[Mongoose] - Error updating all devices`);
        }
      }
    }
  });
}

module.exports = { updateAllDevices, deleteOldDevices };
