const NodeHelper = require("node_helper");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({
  start: function () {
    this.config = {
      syncInterval: 2 * 60 * 1000,
      driveRemote: "drive:mirror-images"
    };

    this.syncTimer = null;
    this.syncInProgress = false;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "MMM_DRIVEIMAGES_CONFIG") {
      this.config = Object.assign({}, this.config, payload || {});
      this.startSyncLoop();
    }
  },

  startSyncLoop: function () {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.syncImages();

    this.syncTimer = setInterval(() => {
      this.syncImages();
    }, this.config.syncInterval);
  },

  syncImages: function () {
    if (this.syncInProgress) {
      console.log("MMM-DriveImages: Sync already in progress, skipping");
      return;
    }

    this.syncInProgress = true;

    const localPath = path.join(this.path, "public", "images");
    const remotePath = this.config.driveRemote || "drive:mirror-images";

    try {
      fs.mkdirSync(localPath, { recursive: true });
    } catch (e) {
      console.error("MMM-DriveImages: Failed to create local images folder", e);
      this.syncInProgress = false;
      return;
    }

    const command = `rclone sync "${remotePath}" "${localPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("MMM-DriveImages: rclone sync failed:", error.message);
      }

      if (stderr) {
        console.error("MMM-DriveImages: rclone stderr:", stderr);
      }

      if (stdout) {
        console.log("MMM-DriveImages: rclone stdout:", stdout);
      }

      const images = this.getImageList(localPath);
      this.sendSocketNotification("MMM_DRIVEIMAGES_IMAGES", { images });

      this.syncInProgress = false;
    });
  },

  getImageList: function (imageDir) {
    try {
      const files = fs.readdirSync(imageDir);

      return files
        .filter((file) => {
          const fullPath = path.join(imageDir, file);
          return fs.statSync(fullPath).isFile();
        })
        .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .sort()
        .map((file) => `/modules/MMM-DriveImages/public/images/${encodeURIComponent(file)}`);
    } catch (e) {
      console.error("MMM-DriveImages: Error reading images folder", e);
      return [];
    }
  }
});
