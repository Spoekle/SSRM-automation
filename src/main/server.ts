const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
      const tempVideoPath = path.join(__dirname, `temp-${uuidv4()}.mp4`);
      fs.writeFileSync(tempVideoPath, videoBuffer);
      console.log('Video written to temporary path:', tempVideoPath);

      ffmpeg.ffprobe(tempVideoPath, (err: any, metadata: any) => {
        if (err) {
          console.error('ffprobe error:', err);
          fs.unlinkSync(tempVideoPath);
          return res.status(500).json({ error: 'Error processing video in ffprobe, no ffmpeg installed?', details: err.message });
        }
        console.log('Video metadata:', metadata);

        const duration = metadata.format.duration;
        const randomTime = Math.random() * duration;
        const tempImagePath = path.join(__dirname, `thumb-${uuidv4()}.png`);
        console.log(`Extracting screenshot at random time ${randomTime} (duration: ${duration})`);

        ffmpeg(tempVideoPath)
          .screenshots({
            timestamps: [randomTime],
            filename: path.basename(tempImagePath),
            folder: path.dirname(tempImagePath),
            size: '320x240'
          })
          .on('end', () => {
            try {
              console.log('Screenshot generated at:', tempImagePath);
              const imgBuffer = fs.readFileSync(tempImagePath);
              const imgBase64 = 'data:image/png;base64,' + imgBuffer.toString('base64');
              // Cleanup temp files
              fs.unlinkSync(tempVideoPath);
              fs.unlinkSync(tempImagePath);
              console.log('Temporary files cleaned up.');
              // Send back the generated thumbnail image.
              res.json({ thumbnail: imgBase64 });
            } catch (readErr: any) {
              console.error('Error reading generated thumbnail:', readErr);
              res.status(500).json({ error: 'Error reading generated thumbnail', details: readErr.message });
            }
          })
          .on('error', (ffmpegErr: any) => {
            console.error('Error during ffmpeg screenshot generation:', ffmpegErr);
            fs.unlinkSync(tempVideoPath);
            if (fs.existsSync(tempImagePath)) {
              fs.unlinkSync(tempImagePath);
            }
            res.status(500).json({ error: 'Error generating thumbnail from video', details: ffmpegErr.message });
          });
      });
    } catch (error: any) {
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
  console.log('Proxy server running on http://localhost:3000');
});
