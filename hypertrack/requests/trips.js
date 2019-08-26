var request = require("request");
var _ = require("lodash");
require("dotenv").config();

function getPlacesById(places, device_id) {
  let output = [];

  for (let i = 0; i < places.length; i++) {
    const place = places[i];

    if (place.device_id === device_id) {
      output.push(place);
    }
  }

  return output;
}

function createTripsForAllDevices() {
  // get all device places using Mongoose
  var devicePlaceCollection = require("../models/device-place.model");

  devicePlaceCollection.find({}, function(err, devicePlaces) {
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
          let tripBody = {
            device_id: device.device_id,
            metadata: {
              scheduled_trip: true
            },
            geofences: []
          };

          // add places as geofences if defined in the sample app
          const places = getPlacesById(devicePlaces, device.device_id);

          for (let p = 0; p < places.length; p++) {
            const place = places[p];

            tripBody.geofences.push({
              geometry: {
                type: "Point",
                coordinates: [place.coordinates.lng, place.coordinates.lat]
              },
              metadata: {
                place_label: place.label,
                place_address: place.address
              }
            });
          }

          options = {
            url: "https://v3.api.hypertrack.com/trips",
            method: "POST",
            headers: {
              Authorization: auth,
              "Content-Type": "application/json"
            },
            json: tripBody
          };

          // create new trips for all devices
          request(options, (error, response, body) => {
            if (!error && response.statusCode == 201) {
              const trip = body;
              console.log(
                `Trip created for device_id '${device.device_id}': ${
                  trip.trip_id
                }`
              );
            }
          });
        });
      }
    });
  });
}

function completeDailyTripsForallDevices() {
  // get all active trips using HyperTrack API
  const base64auth = Buffer.from(
    `${process.env.HT_ACCOUNT_ID}:${process.env.HT_SECRET_KEY}`
  ).toString("base64");
  const auth = `Basic ${base64auth}`;
  let options = {
    url: "https://v3.api.hypertrack.com/trips",
    headers: {
      Authorization: auth
    }
  };

  request(options, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const trips = JSON.parse(body);

      trips.forEach(trip => {
        // complete only daily scheduled trips
        if (_.get(trip, "metadata.scheduled_trip", false)) {
          options = {
            url: `https://v3.api.hypertrack.com/trips/${trip.trip_id}/complete`,
            method: "POST",
            headers: {
              Authorization: auth
            }
          };

          request(options, (error, response, body) => {
            if (!error && response.statusCode == 202) {
              console.log(
                `Trip completed for device_id '${trip.device_id}': ${
                  trip.trip_id
                }`
              );
            }
          });
        }
      });
    }
  });
}

function updateAllTrips() {
  // get all trips (completed and active) using HyperTrack API
  const base64auth = Buffer.from(
    `${process.env.HT_ACCOUNT_ID}:${process.env.HT_SECRET_KEY}`
  ).toString("base64");
  const auth = `Basic ${base64auth}`;
  let options = {
    url: "https://v3.api.hypertrack.com/trips?status=all",
    headers: {
      Authorization: auth
    }
  };

  request(options, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const trips = JSON.parse(body);
      let bulkOps = [];

      // update all trips in mongoDB
      var tripCollection = require("../models/trip.model");

      trips.forEach(trip => {
        let upsertDoc = {
          updateOne: {
            filter: { trip_id: trip["trip_id"] },
            update: trip,
            upsert: true,
            setDefaultsOnInsert: true
          }
        };
        bulkOps.push(upsertDoc);
      });

      if (bulkOps.length > 0) {
        tripCollection.bulkWrite(bulkOps);
      }
    }
  });
}

module.exports = {
  createTripsForAllDevices,
  completeDailyTripsForallDevices,
  updateAllTrips
};