import { Canvas, Image, Font } from 'skia-canvas';
import fs from 'fs';

interface StarRating {
    ES: string;
    NOR: string;
    HARD: string;
    EXP: string;
    EXP_PLUS: string;
}

interface MapInfo {
    metadata: {
        songAuthorName: string;
        songName: string;
        songSubName: string;
        levelAuthorName: string;
        duration: number;
    };
    versions: {
        coverURL: string;
    }[];
}

async function loadImage(url: string): Promise<Image> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    const buffer = Buffer.from(await response.arrayBuffer());
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = `data:image/png;base64,${buffer.toString('base64')}`;
    });
}

export async function generateCard(data: MapInfo, starRatings: StarRating): Promise<string> {
    const canvas = new Canvas(900, 300);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, 900, 300);
    ctx.roundRect(0, 0, 900, 300, 20);
    ctx.clip();

    // Apply blur filter and load the cover image
    ctx.filter = 'blur(10px)';
    const img = await loadImage(data.versions[0].coverURL);
    ctx.drawImage(img, 0, 0, 900, 300);
    

    // Reset filter and draw everything else
    ctx.filter = 'none';
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';

    // Draw the cover image again on the left and round it
    ctx.drawImage(img, 20, 20, 260, 260);
    ctx.roundRect(20, 20, 260, 260, 10);
    ctx.clip();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;
    ctx.stroke();


    ctx.font = '20px Arial';
    ctx.fillText(`${data.metadata.songAuthorName}`, 300, 50);
    ctx.fillText(`${data.metadata.songName}`, 300, 90);
    ctx.fillText(`${data.metadata.songSubName}`, 300, 130);

    ctx.fillText(`${data.metadata.levelAuthorName}`, 300, 170);

    ctx.fillText(`${data.metadata.duration}`, 300, 200);

    ctx.font = '20px Arial';
    ctx.textAlign = 'center';


    ctx.fillStyle = 'green';
    ctx.fillRect(300, 220, 100, 50);
    ctx.roundRect(300, 220, 100, 50, 20);
    ctx.clip();
    ctx.fillStyle = 'white';
    ctx.fillText(`${starRatings.ES}★`, 350, 255);

    ctx.fillStyle = 'blue';
    ctx.fillRect(400, 220, 100, 50);
    ctx.roundRect(400, 220, 100, 50, 20);
    ctx.clip();
    ctx.fillStyle = 'white';
    ctx.fillText(`${starRatings.NOR}★`, 450, 255);

    ctx.fillStyle = 'orange';
    ctx.fillRect(500, 220, 100, 50);
    ctx.roundRect(500, 220, 100, 50, 20);
    ctx.clip();
    ctx.fillStyle = 'white';
    ctx.fillText(`${starRatings.HARD}★`, 550, 255);

    ctx.fillStyle = 'red';
    ctx.fillRect(600, 220, 100, 50);
    ctx.roundRect(600, 220, 100, 50, 20);
    ctx.clip();
    ctx.fillStyle = 'white';
    ctx.fillText(`${starRatings.EXP}★`, 650, 255);

    ctx.fillStyle = 'purple';
    ctx.fillRect(700, 220, 100, 50);
    ctx.roundRect(700, 220, 100, 50, 20);
    ctx.clip();
    ctx.fillStyle = 'white';
    ctx.fillText(`${starRatings.EXP_PLUS}★`, 750, 255);
    return canvas.toDataURL('image/png');
}
