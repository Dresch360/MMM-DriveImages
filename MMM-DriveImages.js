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
    tapToAdvance: true,

    // Arrow controls
    arrowOpacity: 0.15,
    arrowFontSize: 40
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
      imagePath: this.config.imagePath
    });

    this.scheduleUpdate();
  },

  scheduleUpdate: function () {
    setInterval(() => {
      if (this.images.length > 0) {
        this.nextImage();
      }
    }, this.config.slideshowInterval);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "MMM_DRIVEIMAGES_IMAGES") {
      this.images = payload;
      this.loaded = true;
      this.updateDom(this.config.animationSpeed);
    }
  },

  getDom: function () {
    const wrapper = document.createElement("div");

    if (!this.loaded) {
      wrapper.innerHTML = "Loading images...";
      return wrapper;
    }

    if (this.images.length === 0) {
      wrapper.innerHTML = "No images found.";
      return wrapper;
    }

    const img = document.createElement("img");
    img.src = this.images[this.currentIndex];
    img.style.width = "100%";
    img.style.height = "auto";

    if (this.config.tapToAdvance) {
      img.addEventListener("click", () => {
        this.nextImage();
      });
    }

    wrapper.appendChild(img);

    // LEFT ARROW
    const leftArrow = document.createElement("div");
    leftArrow.innerHTML = "◀";
    leftArrow.style.position = "absolute";
    leftArrow.style.left = "10px";
    leftArrow.style.top = "50%";
    leftArrow.style.transform = "translateY(-50%)";
    leftArrow.style.cursor = "pointer";
    leftArrow.style.userSelect = "none";
    leftArrow.style.opacity = this.config.arrowOpacity.toString();
    leftArrow.style.fontSize = this.config.arrowFontSize + "px";

    leftArrow.addEventListener("click", () => {
      this.prevImage();
    });

    // RIGHT ARROW
    const rightArrow = document.createElement("div");
    rightArrow.innerHTML = "▶";
    rightArrow.style.position = "absolute";
    rightArrow.style.right = "10px";
    rightArrow.style.top = "50%";
    rightArrow.style.transform = "translateY(-50%)";
    rightArrow.style.cursor = "pointer";
    rightArrow.style.userSelect = "none";
    rightArrow.style.opacity = this.config.arrowOpacity.toString();
    rightArrow.style.fontSize = this.config.arrowFontSize + "px";

    rightArrow.addEventListener("click", () => {
      this.nextImage();
    });

    wrapper.style.position = "relative";
    wrapper.appendChild(leftArrow);
    wrapper.appendChild(rightArrow);

    return wrapper;
  },

  nextImage: function () {
    if (this.images.length === 0) return;

    if (this.config.playMode === "random") {
      this.currentIndex = Math.floor(Math.random() * this.images.length);
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }

    this.updateDom(this.config.animationSpeed);
  },

  prevImage: function () {
    if (this.images.length === 0) return;

    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;

    this.updateDom(this.config.animationSpeed);
  }
});
