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
      let oldDevices = [];
      let lastlocationUpdated = null;
      devices.forEach(device => {
        // create timestamps for comparison
        if (device && device.location && device.location.recorded_at) {
          lastlocationUpdated = moment(device.location.recorded_at);
          console.log("Last Location Update timestamp : %s", lastlocationUpdated)
        }
        const registeredTime = moment(device.registered_at);
        const lastWeek = moment().subtract(1, "weeks");
        const lastTwoWeeks = moment().subtract(2, "weeks");
        console.log("Registered timestamp - %s", registeredTime)

        // disconnected = 5 days
        if (device.device_status.value === "disconnected") {
          if (lastlocationUpdated && lastlocationUpdated.isBefore(lastWeek) && device.device_info.os_name === "iOS") {
            console.log(
              `****** DELETE DISCONNECTED DEVICE BASED ON LAST LOCATION TIMESTAMP: ${
                device.name
              }. Last updated ${lastlocationUpdated.fromNow()}`
            );
            deleteDevice(device.device_id);
            oldDevices.push(device.device_id);
          } else if (!lastlocationUpdated && registeredTime && registeredTime.isBefore(lastWeek) && device.device_info.os_name === "iOS"){
            console.log(
              `****** DELETE DISCONNECTED DEVICE BASED ON REGISTERED TIMESTAMP: ${
                device.name
              }. Registered ${registeredTime.fromNow()}`
            );
            deleteDevice(device.device_id);
            oldDevices.push(device.device_id);
          }
          else {
              console.log("No deletions for DISCONNECTED devices")
          }
        }

        // inactive = 30 days

        if (device.device_status.value === "inactive") {
          if (lastlocationUpdated && lastlocationUpdated.isBefore(lastTwoWeeks) && device.device_info.os_name === "iOS") {
            console.log(
              `****** DELETE INACTIVE DEVICE BASED ON LAST LOCATION TIMESTAMP: ${
                device.name
              }. Last updated ${lastlocationUpdated.fromNow()}`
            );
            deleteDevice(device.device_id);
            oldDevices.push(device.device_id);
          } else if (!lastlocationUpdated && registeredTime && registeredTime.isBefore(lastWeek) && device.device_info.os_name === "iOS"){
            console.log(
              `****** DELETE INACTIVE DEVICE BASED ON REGISTERED TIMESTAMP: ${
                device.name
              }. Registered ${registeredTime.fromNow()}`
            );
            deleteDevice(device.device_id);
            oldDevices.push(device.device_id);
          }
          else {
              console.log("No deletions for INACTIVE devices")
          }
        }

      });
      console.log(`****** DELETED ${oldDevices.length} DEVICES DURING CLEANUP`);
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
