require("dotenv").config();
const CronJob = require("cron").CronJob;
const amqp = require("amqp-connection-manager");

const WORKER_QUEUE = "hypertrack-queue";

const JOBS = [...require("../jobs/devices"), ...require("../jobs/trips")];

// Create a new connection manager from AMQP
var connection = amqp.connect([process.env.CLOUDAMQP_URL]);
console.log("[AMQP] - Connecting...");

connection.on("connect", function() {
  process.once("SIGINT", function() {
    // Close conn on exit
    connection.close();
  });
  console.log("[AMQP] - Connected!");
  return startCronProcess(JOBS);
});

connection.on("disconnect", function(params) {
  return console.error("[AMQP] - Disconnected.", params.err.stack);
});

const startCronProcess = jobs => {
  if (jobs && jobs.length) {
    jobs.forEach(job => {
      let j = new CronJob({
        cronTime: job.cronTime ? job.cronTime : new Date(job.dateTime),
        onTick: () => {
          sendMessage(job.message);
          if (!job.repeat) j.stop();
        },
        onComplete: () => {
          console.log("Job completed! Removing now...");
        },
        timeZone: "America/Los_Angeles",
        start: true // Start now
      });
    });
  }
};

const sendMessage = message => {
  if (!message) {
    return;
  }

  let queue = message.queue || WORKER_QUEUE;
  let senderChannelWrapper = connection.createChannel({
    json: true,
    setup: function(channel) {
      return channel.assertQueue(queue, { durable: true });
    }
  });

  senderChannelWrapper
    .sendToQueue(queue, message, {
      contentType: "application/json",
      persistent: true
    })
    .then(function() {
      console.log(
        `[AMQP] - Message '${message.taskName}' sent to queue => ${queue}`
      );
      senderChannelWrapper.close();
    })
    .catch(err => {
      console.error(
        `[AMQP] - Message '${
          message.taskName
        }' to queue => ${queue} <= was rejected!`,
        err.stack
      );
      senderChannelWrapper.close();
    });
};
