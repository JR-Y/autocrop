Microservice to autocrop images in one folder to another folder
- Intended for images that can be autocropped with https://www.npmjs.com/package/jimp
- Add your own .env with DIR_TO_WATCH & DIR_TO_WRITE (see example file)
- Compares mtime of possible cropped file & re-crops if newer file is submitted to DIR_TO_WATCH (allows for service restarts, with minimal resource utilization)
- files formats supported .png & .jpg (case insensitive)