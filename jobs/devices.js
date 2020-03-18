// every day at midnight in production, every minute everywhere else
const midnight =
  process.env.NODE_ENV === "production" ? "0 0 * * *" : "* * * * *";
const twoAfter =
  process.env.NODE_ENV === "production" ? "2 0 * * *" : "* * * * *";
const cleanUp =
  process.env.NODE_ENV === "production" ? "20 4 * * *" : "* * * * *";
const queue = "hypertrack-queue";

module.exports = [
  {
    name: "Daily Device Deletion",
    message: {
      taskName: "deleteOldDevices",
      queue
    },
    cronTime: cleanUp,
    repeat: 1
  },
  {
    name: "Daily Tracking Stop",
    message: {
      taskName: "stopTracking",
      queue
    },
    cronTime: midnight,
    repeat: 1
  },
  {
    name: "Daily Tracking Start",
    message: {
      taskName: "startTracking",
      queue
    },
    cronTime: twoAfter,
    repeat: 1
  }
];
