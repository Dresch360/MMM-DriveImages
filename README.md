# MMM-DriveImages
## Preview

![MMM-DriveImages Screenshot](screenshot.png)

MagicMirror module that displays images from a Google Drive folder using rclone.

No API keys. No Google developer setup. Simple browser-based authentication.

---

## Features

* Displays images from Google Drive
* Uses rclone (no API keys required)
* Automatic background syncing (no cron needed)
* Simple setup for non-technical users
* Works with personal Google accounts
* Linear or random play

---

## Installation

Navigate to your MagicMirror modules folder:

```bash
cd ~/MagicMirror/modules
```

Clone the repository:

```bash
git clone https://github.com/Dresch360/MMM-DriveImages.git
```

Make the setup script executable:

```bash
chmod +x MMM-DriveImages/connect
```

---

## Configuration

Add this to your `config.js`:

```js
{
  module: "MMM-DriveImages",
  position: "fullscreen_above",
  config: {
    driveRemote: "drive:mirror-images",
    imagePath: "/home/pi/MagicMirror/modules/MMM-DriveImages/public/images",
    syncInterval: 2 * 60 * 1000,
    syncOnStart: true,
    syncTimeout: 120000,
    slideshowInterval: 10000,
    animationSpeed: 1000,
    playMode: "linear"
  }
},
```
## Configuration Options

| Option              | Description                              | Default                 |
| ------------------- | ---------------------------------------- | ----------------------- |
| `driveRemote`       | Google Drive folder to sync from         | `"drive:mirror-images"` |
| `syncInterval`      | How often to sync with Google Drive (ms) | `2 * 60 * 1000`         |
| `slideshowInterval` | Time between image changes (ms)          | `10000`                 |
| `syncOnStart`       | Run a sync immediately on startup        | `true`                  |
| `animationSpeed`    | Transition speed between images (ms)     | `1000`                  |
| `playMode`          | Playback order for images                | `"linear"`              |

---
### Playback Modes
- `linear` = plays images in order
- `random` = randomizes the next image

## Setup (First Time)

1. Minimize MagicMirror
   Press: `Ctrl + m`

2. Open Terminal

3. Run:

```bash
~/MagicMirror/modules/MMM-DriveImages/connect
```

4. Follow prompts:

* Type `y` to authenticate
* Sign into your Google account
* Return to Terminal
* Type `n` for Shared Drive

MagicMirror will restart automatically.

---

## Adding Photos

### Smartphone (Recommended)

1. Open the Google Drive app
2. Open the folder: `mirror-images`
3. Tap `+` → Upload
4. Press and hold one photo, then select multiple
5. Tap Upload or Select

Images will appear automatically within a few minutes.

---

### Computer (Best for large batches)

1. Go to https://drive.google.com
2. Open the folder: `mirror-images`
3. Drag and drop your images

---

## Notes

* The Google Drive folder `mirror-images` is created automatically during setup
* Folder name must be exactly: `mirror-images` (all lowercase)
* Supported formats: JPG, PNG, GIF, WEBP
* Updates happen automatically (~2 minutes)
* No setup required after initial connection
* If no photos appear, upload images to the `mirror-images` folder

---

## Reset

To remove images and disconnect Google Drive:

```bash
rm -rf ~/MagicMirror/modules/MMM-DriveImages/public/images/*
rm -f ~/.config/rclone/rclone.conf
pm2 restart MagicMirror
```

---

## License

MIT License

