const NodeHelper = require("node_helper");
const http = require('http');
const exec = require("child_process").exec;
const Log = require("../../js/logger");

module.exports = NodeHelper.create({
  /**
   *
   */
  start: function () {
    this.isMonitorOn(function (result) {
      Log.info("MMM-MotionDetector: monitor is " + (result ? "ON" : "OFF") + ".");
    });
  },

  /**
   *
   */
  activateMonitor: function () {
    self = this;
    this.isMonitorOn(function (result) {
      if (!result) {
        exec("vcgencmd display_power 1", function (err, out, code) {
          if (err) {
            Log.error("MMM-MotionDetector: error activating monitor: " + code);
          } else {
            Log.info("MMM-MotionDetector: monitor has been activated.");
          }
        });
        self.blink();
      }
    });
    this.started = false;
  },

  blink: function () {
		http.get('http://localhost:7878/state?state=alert', (resp) => {
			Log.debug("blinked");

		}).on("error", (err) => {
			Log.error("failed to blink: " + err.message);
		});
	},

  /**
   *
   */
  deactivateMonitor: function () {
    this.isMonitorOn(function (result) {
      if (result) {
        exec("vcgencmd display_power 0", function (err, out, code) {
          if (err) {
            Log.error("MMM-MotionDetector: error deactivating monitor: " + code);
          } else {
            Log.info("MMM-MotionDetector: monitor has been deactivated.");
          }
        });
      }
    });
    this.started = false;
  },

  /**
   *
   * @param resultCallback
   */
  isMonitorOn: function (resultCallback) {
    exec("vcgencmd display_power", function (err, out, code) {
      if (err) {
        Log.error("MMM-MotionDetector: error calling monitor status: " + code);
        return;
      }

      Log.info("MMM-MotionDetector: monitor status is " + out);
      resultCallback(out.includes("=1"));
    });
  },

  /**
   *
   * @param notification
   * @param payload
   */
  socketNotificationReceived: function (notification, payload) {
    if (notification === "ACTIVATE_MONITOR") {
      Log.info("MMM-MotionDetector: activating monitor.");
      this.activateMonitor();
    }
    if (notification === "DEACTIVATE_MONITOR") {
      Log.info("MMM-MotionDetector: deactivating monitor.");
      this.deactivateMonitor();
    }
  },
});
