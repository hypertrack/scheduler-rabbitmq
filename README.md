# Sample Tracking Scheduler

Sample RabbitMQ scheduler implementation for scheduled device tracking

# Setup

Follow the installations instructions on the [project website](https://www.rabbitmq.com/download.html).

After the installation, please ensure you can run the local server on your machine before proceeding.
If you are on OSX, you should be able to start a local server with the `rabbitmq-server` command.

## Requirements

Before getting started with the scheduler, please ensure you have ...

- installed RabbitMQ locally or have the service running in your production environment
- a [HyperTrack account](https://dashboard.hypertrack.com/signup)
- the HyperTrack SDK in your application ([iOS](https://github.com/hypertrack/quickstart-ios), [Android](https://github.com/hypertrack/quickstart-android), or [React Native](https://github.com/hypertrack/quickstart-react-native)) or use our sample app to send location data ([iOS](https://github.com/hypertrack/live-app-ios) or [Android](https://github.com/hypertrack/live-app-android))
- Set the following environmental varibales in an `.env` file or in on your host (e.g. Heroku)
  - `process.env.CLOUDAMQP_URL` needs to resolve to an accessible server
  - `process.env.HT_ACCOUNT_ID` needs to be your HyperTrack account ID (from [the dashboard](https://dashboard.hypertrack.com/setup))
  - `process.env.HT_SECRET_KEY` needs to be your HyperTrack secret key (from [the dashboard](https://dashboard.hypertrack.com/setup))
  - `process.env.NODE_ENV` is set to `production` to avoid test execution on a minute basis

## Deploying to Heroku

This project is set up to be deployed to Heroku within seconds.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/hypertrack/scheduler-rabbitmq)

## Starting the scheduler locally

In the `/scheduler` folder, you will find a `schedule.js` file. Please review the constants and change according to your preferences. You can start the scheduler using node:
`node scheduler/schedule.js`

> Note: If deployed outside of production, the scheduler will add tasks to the queue every minute. Keep in mind that the scheduler will add tasks indepdent of execution. The tasks will "pile up" if not executed right away.

## Starting the worker locally

In the `/worker` folder, you will find a `work.js` file. Please review the constants and change according to your preferences. You can start the scheduler using node:
`node worker/work.js`

> Note: If deployed outside of production, the worker will seize tasks from the queue every minute. Keep in mind that the worker will seize ALL tasks in the queue at once.

# Modifications

You can modify the cron schedules and add/update/remove jobs based on yoru own requirements.

## Changing cron schedules

In the `/jobs` folder, you will find multiple files based. These files define job names and the cron schedule expression. Feel free to change the schedule (with the help of tools like [crontab guru](https://crontab.guru/)).

## Adding new jobs

In on of the `/jobs` files, you cann append a JSON object to the array:

```
  {
    name: "Sample Task Name",
    message: {
      taskName: "sampleTask", // this needs to match in the worker exeuction
      queue
    },
    cronTime,
    repeat: 1
  }
```

Next, you need to update your `worker/work.js` and add a new switch ase for the newly defined `taskName`:

```
switch (message.taskName) {
    case "sampleTask":
      someMethod(); // this is your own method for the task execution
      break;
...
```
