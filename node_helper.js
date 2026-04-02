const NodeHelper = require("node_helper");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({
  start: function () {
    this.config = null;
    this.syncTimer = null;
    this.syncInProgress = false;
    this.currentImages = [];
    this.started = false;
    console.log("[MMM-DriveImages] node_helper started");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "MMM_DRIVEIMAGES_CONFIG") {
      this.config = payload;
      this.startBackgroundSync();
    }

    if (notification === "MMM_DRIVEIMAGES_FORCE_SYNC") {
      this.runSync();
    }
  },

  startBackgroundSync: function () {
    if (!this.config || this.started) {
      return;
    }

    this.started = true;

    if (this.config.syncOnStart) {
      this.runSync();
    } else {
      this.sendImageListToFrontend();
    }

    this.syncTimer = setInterval(() => {
      this.runSync();
    }, this.config.syncInterval);

    console.log(
      `[MMM-DriveImages] background sync started every ${this.config.syncInterval} ms`
    );
  },

  runSync: function () {
    if (!this.config) {
      return;
    }

    if (this.syncInProgress) {
      console.log("[MMM-DriveImages] sync skipped, already running");
      return;
    }

    this.syncInProgress = true;

    const remotePath = this.config.driveRemote || "drive:mirror-images";
    const localPath = this.config.imagePath;
    const rcloneCommand = `"${this.config.rcloneBinary || "rclone"}" sync "${remotePath}" "${localPath}" --create-empty-src-dirs`;

    console.log(`[MMM-DriveImages] running sync: ${rcloneCommand}`);

    exec(rcloneCommand, { timeout: this.config.syncTimeout || 120000 }, (error, stdout, stderr) => {
      this.syncInProgress = false;

      if (error) {
        console.error("[MMM-DriveImages] sync failed:", error.message);
        if (stderr) {
          console.error("[MMM-DriveImages] stderr:", stderr);
        }
        this.sendSocketNotification("MMM_DRIVEIMAGES_SYNC_ERROR", {
          error: error.message,
          stderr: stderr || ""
        });
        return;
      }

      if (stdout) {
        console.log("[MMM-DriveImages] sync stdout:", stdout);
      }

      if (stderr) {
        console.log("[MMM-DriveImages] sync stderr:", stderr);
      }

      this.sendImageListToFrontend();
    });
  },

  sendImageListToFrontend: function () {
    if (!this.config) {
      return;
    }

    const imageDir = this.config.imagePath;
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    fs.readdir(imageDir, (err, files) => {
      if (err) {
        console.error("[MMM-DriveImages] failed reading image directory:", err.message);
        this.sendSocketNotification("MMM_DRIVEIMAGES_SYNC_ERROR", {
          error: err.message
        });
        return;
      }

      const images = files
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return allowedExtensions.includes(ext);
        })
        .sort((a, b) => a.localeCompare(b))
        .map((file) => `/modules/MMM-DriveImages/public/images/${encodeURIComponent(file)}`);

      const changed =
        JSON.stringify(images) !== JSON.stringify(this.currentImages);

      this.currentImages = images;

      if (changed) {
        console.log(`[MMM-DriveImages] image list updated, ${images.length} image(s) found`);
      } else {
        console.log("[MMM-DriveImages] image list unchanged");
      }

      this.sendSocketNotification("MMM_DRIVEIMAGES_IMAGES", {
        images: images,
        changed: changed,
        count: images.length
      });
    });
  },

  stop: function () {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
});
