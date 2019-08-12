// every day at midnight in production, every minute everywhere else
const cronTime =
  process.env.NODE_ENV === "production" ? "0 0 * * *" : "* * * * *";
const queue = process.env.CLOUDAMQP_QUEUE;

module.exports = [
  {
    name: "Daily Trip Completion",
    message: {
      taskName: "completeTrips",
      queue
    },
    cronTime,
    repeat: 1
  },
  {
    name: "Daily Trip DB Sync",
    message: {
      taskName: "syncTrips",
      queue
    },
    cronTime,
    repeat: 1
  },
  {
    name: "Daily Trip Creation",
    message: {
      taskName: "createTrips",
      queue
    },
    cronTime,
    repeat: 1
  }
];
