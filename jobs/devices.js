// every day at midnight in production, every minute everywhere else
const midnight =
  process.env.NODE_ENV === "production" ? "0 0 * * *" : "* * * * *";
const queue = "hypertrack-queue";

module.exports = [
  {
    name: "Daily Device DB Sync",
    message: {
      taskName: "syncDevices",
      queue
    },
    midnight,
    repeat: 1
  }
];
