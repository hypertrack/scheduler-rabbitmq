require("dotenv").config();
const ht = require('hypertrack')(process.env.HT_ACCOUNT_ID, process.env.HT_SECRET_KEY);
const _ = require("lodash");
const moment = require("moment");

function deleteOldDevices() {
  // get all devices using HyperTrack API
  ht.devices.getAll().then(devices => {
    let oldDevices = [];
    let lastlocationUpdated = null;
    devices.forEach(device => {
      // create timestamps for comparison
      if (device && device.location && device.location.recorded_at) {
        lastlocationUpdated = moment(device.location.recorded_at);
      }
      const registeredTime = moment(device.registered_at);
      const lastWeek = moment().subtract(1, "weeks");
      const lastTwoWeeks = moment().subtract(2, "weeks");
      const twoDays = moment().subtract(2, "days");

      // delete disconnected devices based on window period
      if (device.device_status.value === "disconnected") {
        if (lastlocationUpdated && lastlocationUpdated.isBefore(lastWeek) && device.device_info && device.device_info.os_name && device.device_info.os_name === "iOS") {
          console.log(
            `****** DELETE DISCONNECTED DEVICE BASED ON LAST LOCATION TIMESTAMP: ${
              device.name
            }. Last updated ${lastlocationUpdated.fromNow()}`
          );
          ht.devices.delete(device.device_id);
          oldDevices.push(device.device_id);
        } else {
          if (!lastlocationUpdated && registeredTime && registeredTime.isBefore(twoDays) && device.device_info && device.device_info.os_name && device.device_info.os_name === "iOS"){
            console.log(
              `****** DELETE DISCONNECTED DEVICE BASED ON REGISTERED TIMESTAMP: ${
                device.name
              }. Registered ${registeredTime.fromNow()}`
            );
            ht.devices.delete(device.device_id);
            oldDevices.push(device.device_id);
          }
        }
      }
      // delete inactive devices based on window period
      if (device.device_status.value === "inactive") {
        if (lastlocationUpdated && lastlocationUpdated.isBefore(lastTwoWeeks) && device.device_info && device.device_info.os_name && device.device_info.os_name === "iOS") {
          console.log(
            `****** DELETE INACTIVE DEVICE BASED ON LAST LOCATION TIMESTAMP: ${
              device.name
            }. Last updated ${lastlocationUpdated.fromNow()}`
          );
          ht.devices.delete(device.device_id);
          oldDevices.push(device.device_id);
        } else {
          if (!lastlocationUpdated && registeredTime && registeredTime.isBefore(twoDays) && device.device_info && device.device_info.os_name && device.device_info.os_name === "iOS"){
          console.log(
            `****** DELETE INACTIVE DEVICE BASED ON REGISTERED TIMESTAMP: ${
              device.name
            }. Registered ${registeredTime.fromNow()}`
          );
          ht.devices.delete(device.device_id);
          oldDevices.push(device.device_id);
        }
      }
    }
    });
    console.log(`****** DELETED ${oldDevices.length} DEVICES DURING CLEANUP`);
  })
}

module.exports = {
  deleteOldDevices
};
