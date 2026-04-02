Module.register("MMM-DriveImages", {
  defaults: {
    syncInterval: 2 * 60 * 1000,
    syncOnStart: true,
    syncTimeout: 120000,
    driveRemote: "drive:mirror-images",
    imagePath: "/home/pi/MagicMirror/modules/MMM-DriveImages/public/images",
    slideshowInterval: 10000,
    animationSpeed: 1000
  },

  start: function () {
    this.images = [];
    this.currentIndex = 0;
    this.loaded = false;

    this.sendSocketNotification("MMM_DRIVEIMAGES_CONFIG", {
      syncInterval: this.config.syncInterval,
      syncOnStart: this.config.syncOnStart,
      syncTimeout: this.config.syncTimeout,
      driveRemote: this.config.driveRemote,
      imagePath: this.config.imagePath,
      rcloneBinary: this.config.rcloneBinary || "rclone"
    });

    this.startSlideshow();
  },

  startSlideshow: function () {
    setInterval(() => {
      if (this.images.length > 1) {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateDom(this.config.animationSpeed);
      }
    }, this.config.slideshowInterval);
  },

  getDom: function () {
    const wrapper = document.createElement("div");

    if (!this.loaded) {
      wrapper.innerHTML = "Loading images...";
      return wrapper;
    }

    if (!this.images.length) {
      wrapper.innerHTML = "No images found";
      return wrapper;
    }

    const img = document.createElement("img");
    img.src = this.images[this.currentIndex];
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.display = "block";

    wrapper.appendChild(img);
    return wrapper;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "MMM_DRIVEIMAGES_IMAGES") {
      const oldCurrent = this.images[this.currentIndex] || null;
      this.images = payload.images || [];
      this.loaded = true;

      if (!this.images.length) {
        this.currentIndex = 0;
      } else {
        const existingIndex = oldCurrent ? this.images.indexOf(oldCurrent) : -1;
        this.currentIndex = existingIndex >= 0 ? existingIndex : 0;
      }

      this.updateDom(this.config.animationSpeed);
    }

    if (notification === "MMM_DRIVEIMAGES_SYNC_ERROR") {
      console.error("[MMM-DriveImages] sync error:", payload);
    }
  }
});
