import express from 'express';
import log from 'electron-log';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'upload-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 * 1024 } // 20GB limit
});

interface ScoreSaberRequest {
  params: {
    hash: string;
    difficulty: string;
  };
}

interface ScoreSaberResponse {
  setHeader: (header: string, value: string) => void;
  json: (data: any) => void;
  status: (code: number) => ScoreSaberResponse;
}

interface BeatSaverRequest {
  params: {
    hash: string;
  };
}

interface BeatSaverResponse {
  setHeader: (header: string, value: string) => void;
  json: (data: any) => void;
  status: (code: number) => BeatSaverResponse;
}

app.get('/api/scoresaber/:hash/:difficulty', async (req: ScoreSaberRequest, res: ScoreSaberResponse) => {
  const { hash, difficulty } = req.params;
  try {
    const response = await axios.get(`https://scoresaber.com/api/leaderboard/by-hash/${hash}/info?difficulty=${difficulty}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(response.data);
  } catch (error) {
    log.error(error);
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from ScoreSaber API' });
  }
});

app.get('/api/beatsaver/:hash', async (req: BeatSaverRequest, res: BeatSaverResponse) => {
  const { hash } = req.params;
  try {
    const response = await axios.get(`https://api.beatsaver.com/maps/hash/${hash}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(response.data);
  } catch (error) {
    log.error(error);
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from BeatSaver API' });
  }
});

// POST /api/generate-thumbnail
app.post('/api/generate-thumbnail', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileType = req.body.fileType;
    const filePath = req.file.path;

    // Process based on file type
    if (fileType === 'video') {
      log.info('Processing video file:', filePath);

      // Use ffprobe to get video metadata
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          log.error('ffprobe error:', err);
          fs.unlinkSync(filePath);
          return res.status(500).json({ error: 'Error analyzing video' });
        }

        const duration = metadata.format.duration || 10;
        const randomTime = Math.random() * duration;
        const tempImagePath = path.join(os.tmpdir(), `thumb-${uuidv4()}.png`);

        log.info(`Extracting frame at ${randomTime}s from video (duration: ${duration}s)`);

        // Extract a random frame from the video
        ffmpeg(filePath)
          .screenshots({
            timestamps: [randomTime],
            filename: path.basename(tempImagePath),
            folder: path.dirname(tempImagePath),
            size: '1920x1080',
          })
          .on('end', () => {
            try {
              log.info('Frame extracted successfully to:', tempImagePath);

              // Read the image and convert to base64
              const imgBuffer = fs.readFileSync(tempImagePath);
              const imgBase64 = 'data:image/png;base64,' + imgBuffer.toString('base64');

              // Clean up temp files
              fs.unlinkSync(filePath);
              fs.unlinkSync(tempImagePath);

              res.json({ thumbnail: imgBase64 });
            } catch (readErr) {
              log.error('Error reading generated thumbnail:', readErr);

              // Clean up on error
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
              if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);

              res.status(500).json({ error: 'Error reading generated thumbnail' });
            }
          })
          .on('error', (ffmpegErr) => {
            log.error('Error during ffmpeg processing:', ffmpegErr);

            // Clean up on error
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);

            res.status(500).json({ error: 'Error generating thumbnail from video' });
          });
      });
    } else {
      // For images, read the file and return as base64
      log.info('Processing image file:', filePath);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          log.error('Error reading image file:', err);
          return res.status(500).json({ error: 'Error reading image file' });
        }

        // Get mime type from file extension
        const ext = path.extname(req.file!.originalname).toLowerCase();
        let mimeType = 'image/jpeg';

        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.webp') mimeType = 'image/webp';

        const base64Image = `data:${mimeType};base64,${data.toString('base64')}`;

        // Clean up
        fs.unlinkSync(filePath);

        res.json({ thumbnail: base64Image });
      });
    }
  } catch (error) {
    log.error('Unexpected error processing file:', error);

    // Clean up if file exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Unexpected error processing file' });
  }
});

app.listen(3000, () => {
  log.info('Proxy server running on http://localhost:3000');
  console.log('Proxy server running on http://localhost:3000');
});
