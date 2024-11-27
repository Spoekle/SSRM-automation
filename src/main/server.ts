const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

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

app.listen(3000, () => {
  console.log('Proxy server running on http://localhost:3000');
});
