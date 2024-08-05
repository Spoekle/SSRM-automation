const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Create a tmp/uploads directory if it doesn't exist
const UPLOAD_DIR = path.join(__dirname, 'tmp', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use('/download', express.static(UPLOAD_DIR));
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/generate-assets', upload.single('file'), async (req, res) => {
  console.log('Received request to generate assets:', req.body);

  const { mapId, useSubname, youtubeLink } = req.body;

  try {
    const videoFramePath = await extractFrame(req);
    const mapInfo = await fetchMapInfo(mapId);

    const coverImageUrl = mapInfo.versions[0].coverURL;
    const coverImagePath = await downloadImage(coverImageUrl);

    if (useSubname === false) {
      mapInfo.metadata.songSubName = '';
    }

    console.log('Assets generated!');

    res.json({ videoFramePath, coverImagePath });
  } catch (error) {
    console.error('Error generating assets:', error.message);
    res.status(500).send('Error generating assets');
  }
});

async function fetchMapInfo(mapId) {
  try {
    const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching map info: ${error.message}`);
  }
}

async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');
    const imagePath = path.join(UPLOAD_DIR, 'cover.png');
    fs.writeFileSync(imagePath, imageBuffer);
    return imagePath;
  } catch (error) {
    throw new Error(`Error downloading image: ${error.message}`);
  }
}

async function extractFrame(req) {
  return new Promise((resolve, reject) => {
    const tmpInputPath = path.join(UPLOAD_DIR, 'input.mp4');
    const tmpOutputPath = path.join(UPLOAD_DIR, 'frame.png');

    if (req.file) {
      fs.writeFileSync(tmpInputPath, req.file.buffer);
      processVideo(tmpInputPath, tmpOutputPath, resolve, reject);
    } else if (req.body.youtubeLink) {
      const videoStream = ytdl(req.body.youtubeLink, { quality: 'highest' })
        .pipe(fs.createWriteStream(tmpInputPath));

      videoStream.on('finish', () => {
        processVideo(tmpInputPath, tmpOutputPath, resolve, reject);
      });

      videoStream.on('error', (err) => {
        console.error('Error downloading video:', err);
        reject(err);
      });
    } else {
      reject(new Error('No video file or YouTube link provided'));
    }
  });
}

function processVideo(inputPath, outputPath, resolve, reject) {
  ffmpeg(inputPath)
    .on('end', () => {
      resolve(outputPath);
    })
    .on('error', (err) => {
      console.error('Error extracting frame:', err);
      reject(err);
    })
    .screenshots({
      count: 1,
      folder: UPLOAD_DIR,
      filename: path.basename(outputPath),
      size: '1280x720',
    });
}

app.get('/download/:type', (req, res) => {
  const { type } = req.params;
  let filePath;

  if (type === 'videoFrame') {
    filePath = path.join(UPLOAD_DIR, 'frame.png');
  } else if (type === 'coverImage') {
    filePath = path.join(UPLOAD_DIR, 'cover.png');
  } else {
    return res.status(400).send('Invalid file type requested');
  }

  res.download(filePath, (err) => {
    if (err) {
      console.error(`Error sending ${type} file:`, err);
      res.status(500).send('Error downloading file');
    }
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting ${type} file:`, err);
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
