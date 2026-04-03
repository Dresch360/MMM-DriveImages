Module.register("MMM-DriveImages", {
  defaults: {
    syncInterval: 2 * 60 * 1000,
    syncOnStart: true,
    syncTimeout: 120000,
    driveRemote: "drive:mirror-images",
    imagePath: "/home/pi/MagicMirror/modules/MMM-DriveImages/public/images",
    slideshowInterval: 10000,
    animationSpeed: 1000,
    playMode: "linear",
    touchControls: true,
    objectFit: "cover",
    showArrows: true
  },

  start: function () {
    this.images = [];
    this.currentIndex = 0;
    this.loaded = false;
    this.paused = false;

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

  getNextIndex: function () {
    if (!this.images || this.images.length === 0) return 0;

    if (this.config.playMode === "random") {
      if (this.images.length === 1) return 0;

      let next;
      do {
        next = Math.floor(Math.random() * this.images.length);
      } while (next === this.currentIndex);

      return next;
    }

    return (this.currentIndex + 1) % this.images.length;
  },

  showNextImage: function () {
    if (this.images.length > 1) {
      this.currentIndex = this.getNextIndex();
      this.updateDom(this.config.animationSpeed);
    }
  },

  showPrevImage: function () {
    if (this.images.length > 1) {
      this.currentIndex =
        (this.currentIndex - 1 + this.images.length) % this.images.length;
      this.updateDom(this.config.animationSpeed);
    }
  },

  startSlideshow: function () {
    setInterval(() => {
      if (!this.paused) {
        this.showNextImage();
      }
    }, this.config.slideshowInterval);
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.overflow = "hidden";

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
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = this.config.objectFit;

    // Touch + click behavior
    if (this.config.touchControls) {
      let startX = 0;

      img.addEventListener("touchstart", (e) => {
        startX = e.changedTouches[0].screenX;
      }, { passive: true });

      img.addEventListener("touchend", (e) => {
        const endX = e.changedTouches[0].screenX;
        const diff = endX - startX;

        if (Math.abs(diff) > 50) {
          diff < 0 ? this.showNextImage() : this.showPrevImage();
        } else {
          this.paused = !this.paused;
        }
      }, { passive: true });

      img.addEventListener("pointerup", (e) => {
        if (e.pointerType === "mouse") {
          this.paused = !this.paused;
        }
      });
    }

    wrapper.appendChild(img);

    // Arrows
    if (this.config.showArrows && this.images.length > 1) {
      const createArrow = (dir) => {
        const arrow = document.createElement("div");
        arrow.innerHTML = dir === "left" ? "◀" : "▶";

        arrow.style.position = "absolute";
        arrow.style.top = "50%";
        arrow.style[dir === "left" ? "left" : "right"] = "20px";
        arrow.style.transform = "translateY(-50%)";
        arrow.style.fontSize = "40px";
        arrow.style.color = "white";
        arrow.style.background = "rgba(0,0,0,0.3)";
        arrow.style.padding = "10px";
        arrow.style.cursor = "pointer";
        arrow.style.userSelect = "none";
        arrow.style.opacity = "0.25";
        arrow.style.background = "transparent";
        arrow.style.fontSize = "40px";
        
        arrow.addEventListener("click", () => {
          dir === "left" ? this.showPrevImage() : this.showNextImage();
        });

        return arrow;
      };

      wrapper.appendChild(createArrow("left"));
      wrapper.appendChild(createArrow("right"));
    }

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
