require("dotenv").config();
const request = require("request");
const rp = require("request-promise");
const _ = require("lodash");
const tripCollection = require("../models/trip.model");

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
      if (!error && response.statusCode === 200) {
        const devices = JSON.parse(body);

        devices.forEach(device => {
          // known bug: devices without location exposed in API
          // skip devices without a location
          if (!_.get(device, "location.recorded_at", false)) {
            return;
          }

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
                label: place.label
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
          request(options, (err, resp, bd) => {
            if (!err && resp.statusCode === 201) {
              const trip = bd;
              console.log(
                `Trip created for device_id '${device.device_id}': ${trip.trip_id}`
              );
            } else {
              console.log(resp.body, err);
            }
          });
        });
      } else {
        console.log(response.body, error);
      }
    });
  });
}

async function completeDailyTripsForallDevices() {
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
  let trips = [];
  let tripResponse;

  while (options.url !== null) {
    console.log("Pagination through all trips with URL: ", options.url);

    await rp(options)
      .then(function(body) {
        tripResponse = JSON.parse(body);
        trips = tripResponse.data;

        // set up pagination
        options.url = _.get(tripResponse, "links.next", null);

        if (trips && Array.isArray(trips) && trips.length > 0) {
          trips.forEach(trip => {
            // complete only daily scheduled trips
            if (_.get(trip, "metadata.scheduled_trip", false)) {
              request(
                {
                  url: `https://v3.api.hypertrack.com/trips/${trip.trip_id}/complete`,
                  method: "POST",
                  headers: {
                    Authorization: auth
                  }
                },
                (err, resp, bd) => {
                  if (!err && resp.statusCode === 202) {
                    console.log(
                      `Trip completed for device_id '${trip.device_id}': ${trip.trip_id}`
                    );
                  } else {
                    console.log(resp.body, err);
                  }
                }
              );
            }
          });
        }
      })
      .catch(function(err) {
        console.log("Error getting all trips: ", err);
      });
  }
}

async function updateAllTrips() {
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
  let trips = [];
  let bulkOps = [];
  let tripResponse;

  while (options.url !== null) {
    console.log("Pagination through all trips with URL: ", options.url);

    await rp(options)
      .then(function(body) {
        tripResponse = JSON.parse(body);
        trips.push(tripResponse.data);

        // set up pagination
        options.url = _.get(tripResponse, "links.next", null);

        // update all trips in mongoDB
        if (tripResponse.data && Array.isArray(tripResponse.data)) {
          tripResponse.data.forEach(trip => {
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
        }
      })
      .catch(function(err) {
        console.log("Error getting all trips: ", err);
      });
  }

  if (bulkOps.length > 0) {
    try {
      tripCollection.bulkWrite(bulkOps).then(res => {
        console.log(
          `[Mongoose] - Updating all trips: ${res.modifiedCount} updated, ${res.insertedCount} added`
        );
      });
    } catch (e) {
      console.log(`[Mongoose] - Error updating all trips`);
    }
  }
}

module.exports = {
  createTripsForAllDevices,
  completeDailyTripsForallDevices,
  updateAllTrips
};
