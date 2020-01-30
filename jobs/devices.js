// every day at midnight in production, every minute everywhere else
const midnight =
  process.env.NODE_ENV === "production" ? "0 0 * * *" : "* * * * *";
const twoAfter =
  process.env.NODE_ENV === "production" ? "2 0 * * *" : "* * * * *";
const queue = "hypertrack-queue";

module.exports = [
  {
    name: "Daily Device Deletion",
    message: {
      taskName: "deleteOldDevices",
      queue
    },
    cronTime: midnight,
    repeat: 1
  },
  {
    name: "Daily Device DB Sync",
    message: {
      taskName: "syncDevices",
      queue
    },
    cronTime: twoAfter,
    repeat: 1
  }
];
