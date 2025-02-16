import express from 'express';
import log from 'electron-log';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5000mb' }));

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
app.post('/api/generate-thumbnail', async (req: any, res: any) => {
  const { background, video } = req.body;
  if (video) {
    try {
      const base64Data = video.includes('base64,') ? video.split('base64,')[1] : video;
      const videoBuffer = Buffer.from(base64Data, 'base64');
      const tempVideoPath = path.join(os.tmpdir(), `temp-${uuidv4()}.mp4`);
      fs.writeFileSync(tempVideoPath, videoBuffer);
      log.info('Video written to temporary path:', tempVideoPath);
      console.log('Video written to temporary path:', tempVideoPath);

      ffmpeg.ffprobe(tempVideoPath, (err: any, metadata: any) => {
        if (err) {
          log.error('ffprobe error:', err);
          console.error('ffprobe error:', err);
          fs.unlinkSync(tempVideoPath);
          return res.status(500).json({ error: 'Error processing video in ffprobe, no ffmpeg installed?', details: err.message });
        }
        log.info('Video metadata:', metadata);
        console.log('Video metadata:', metadata);

        const duration = metadata.format.duration;
        const randomTime = Math.random() * duration;
        const tempImagePath = path.join(os.tmpdir(), `thumb-${uuidv4()}.png`);
        log.info(`Extracting screenshot at random time ${randomTime} (duration: ${duration})`);
        console.log(`Extracting screenshot at random time ${randomTime} (duration: ${duration})`);

        ffmpeg(tempVideoPath)
          .screenshots({
            timestamps: [randomTime],
            filename: path.basename(tempImagePath),
            folder: path.dirname(tempImagePath),
            size: '1920x1080',
          })
          .on('end', () => {
            try {
              log.info('Screenshot generated at:', tempImagePath);
              console.log('Screenshot generated at:', tempImagePath);
              const imgBuffer = fs.readFileSync(tempImagePath);
              const imgBase64 = 'data:image/png;base64,' + imgBuffer.toString('base64');
              // Cleanup temp files
              fs.unlinkSync(tempVideoPath);
              fs.unlinkSync(tempImagePath);
              log.info('Temporary files cleaned up.');
              console.log('Temporary files cleaned up.');
              // Send back the generated thumbnail image.
              res.json({ thumbnail: imgBase64 });
            } catch (readErr: any) {
              log.error('Error reading generated thumbnail:', readErr);
              console.error('Error reading generated thumbnail:', readErr);
              res.status(500).json({ error: 'Error reading generated thumbnail', details: readErr.message });
            }
          })
          .on('error', (ffmpegErr: any) => {
            log.error('Error during ffmpeg screenshot generation:', ffmpegErr);
            console.error('Error during ffmpeg screenshot generation:', ffmpegErr);
            fs.unlinkSync(tempVideoPath);
            if (fs.existsSync(tempImagePath)) {
              fs.unlinkSync(tempImagePath);
            }
            res.status(500).json({ error: 'Error generating thumbnail from video', details: ffmpegErr.message });
          });
      });
    } catch (error: any) {
      log.error('Unexpected error processing video:', error);
      console.error('Unexpected error processing video:', error);
      return res.status(500).json({ error: 'Unexpected error processing video', details: error.message });
    }
  } else if (background) {
    return res.json({ thumbnail: background });
  } else {
    return res.status(400).json({ error: 'No video or background provided' });
  }
});

app.listen(3000, () => {
  log.info('Proxy server running on http://localhost:3000');
  console.log('Proxy server running on http://localhost:3000');
});
