// every day at midnight in production, every minute everywhere else
const midnight =
  process.env.NODE_ENV === "production" ? "0 0 * * *" : "* * * * *";
const twoAfter =
  process.env.NODE_ENV === "production" ? "2 0 * * *" : "* * * * *";
const fourAfter =
  process.env.NODE_ENV === "production" ? "4 0 * * *" : "* * * * *";
const queue = "hypertrack-queue";

module.exports = [
  {
    name: "Daily Trip Completion",
    message: {
      taskName: "completeTrips",
      queue
    },
    midnight,
    repeat: 1
  },
  {
    name: "Daily Trip Creation",
    message: {
      taskName: "createTrips",
      queue
    },
    twoAfter,
    repeat: 1
  },
  {
    name: "Daily Trip DB Sync",
    message: {
      taskName: "syncTrips",
      queue
    },
    fourAfter,
    repeat: 1
  }
];
