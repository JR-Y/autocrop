const fs = require('fs');
const path = require('path');
let chokidar = require('chokidar');
let jimp = require("jimp");
require('dotenv').config()

let log = console.log.bind(console);

let workList = [];
let workListInprogress = [];

let dirToWatch = process.env.DIR_TO_WATCH;
log(dirToWatch);

let dirToWrite = process.env.DIR_TO_WRITE;
log(dirToWrite);


let filesToConvert = [
    ".JPG",
    ".PNG"
];

function readFileStatsSync(srcPath) {
    try {
        return fs.statSync(srcPath)
    } catch (error) {
        return undefined;
    }
};

function getCropSmallName(pathToFile) {
    try {
        let ext = path.extname(pathToFile);
        let fileName = path.basename(pathToFile, ext);
        return path.join(dirToWrite, fileName + "_Crop_small" + ext)
    } catch (error) {
        log("getCropSmallFileName " + error);
        return
    }
}
function getFileName(pathToFile) {
    try {
        let ext = path.extname(pathToFile);
        return path.basename(pathToFile, ext);
    } catch (error) {
        log("getFileName " + error);
        return
    }
}

function checkIfConvert(pathToFile) {
    try {

        //log("Watch function called on: " + pathToFile);

        let fileName = getFileName(pathToFile);

        if (fileName.slice(-9) == "Isometric") {//crop only isometric cad drawings
            try {
                let cropSmallFile = getCropSmallName(pathToFile);
                let cropSmallStats = readFileStatsSync(cropSmallFile);
                let newStats = readFileStatsSync(pathToFile);

                if (!cropSmallStats) {
                    workList.push(pathToFile)
                } else if (newStats && cropSmallStats && newStats.mtime.getTime() > cropSmallStats.mtime.getTime()) {
                    workList.push(pathToFile)
                }

            } catch (error) {
                log("Autocrop check if convert function: " + error);
            }
        }
    } catch (error) {
        log("Cropwatcher add error: " + error + ", on file: " + pathToFile);
    }

}




function convert(pathToFile) {
    try {
        let newFullPath = getCropSmallName(pathToFile);
        log('convert called on: ' + pathToFile)
        jimp.read(pathToFile).then(function (image) {
            /*
            image.autocrop(0.0002, 10, false) // note jimp source edited to accept border size as second argument: image.autocrop(0.0002, false) -> image.autocrop(0.0002, 10, false) see JIMPMOD replace jimp index with JIMPMOD index
                .quality(60)
                .resize(600, jimp.AUTO)
                .write(newFullPath); // save
            */
            image.autocrop({
                "tolerance": 0.0002,
                "leaveBorder": 10,
                "cropOnlyFrames": false
            }).quality(60)
                .resize(600, jimp.AUTO)
                .write(newFullPath); // save
            log("dir: " + pathToFile);
            workList = workList.filter(val => val !== pathToFile);
            workListInprogress = workListInprogress.filter(val => val !== pathToFile);
            console.log(workList.length)
        }).catch(function (err) {
            console.error({file:pathToFile,error:err});
            workList = workList.filter(val => val !== pathToFile);
            workListInprogress = workListInprogress.filter(val => val !== pathToFile);
        });

    } catch (error) {
        log("Autocrop file error: " + error);
        workList = workList.filter(val => val !== pathToFile);
        workListInprogress = workListInprogress.filter(val => val !== pathToFile);
    }
};



log("Watch started");
let cropWatcher = chokidar.watch(dirToWatch, {
    ignored: /[\/\\]\./, persistent: true,
    awaitWriteFinish: true,
    ignored: '*.db',
    usePolling: true
});


function convertTimerTask() {
    let convertFive = workList.slice(0, 5);
    convertFive.forEach(pathToFile => {
        if (workListInprogress.length < 5 && !workListInprogress.includes(pathToFile)) {
            convert(pathToFile);
            workListInprogress.push(pathToFile)
        }
    })
}

setInterval(convertTimerTask, 20000);

if (dirToWatch && dirToWrite) {
cropWatcher
    .on('error', error => log(`Watcher error: ${error}`))
    .on('add', function (pathToFile) {
        let ext = path.extname(pathToFile);
        if (filesToConvert.includes(ext.toUpperCase())) {
            checkIfConvert(pathToFile)
        }
    })
    .on('change', function (pathToFile) {
        let ext = path.extname(pathToFile);
        if (filesToConvert.includes(ext.toUpperCase())) {
            checkIfConvert(pathToFile)
        }
    });
} else {
    console.error("No environment variable provided, DIR_TO_WRITE & DIR_TO_WATCH")
}
