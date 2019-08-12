// every day at midnight in production, every minute everywhere else
const cronTime =
  process.env.NODE_ENV === "production" ? "0 0 * * *" : "* * * * *";
const queue = process.env.CLOUDAMQP_QUEUE;

module.exports = [
  {
    name: "Daily Device DB Sync",
    message: {
      taskName: "syncDevices",
      queue
    },
    cronTime,
    repeat: 1
  }
];
