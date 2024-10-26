// pages/api/query.js

import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(req, res) {

  const body = await req.json() 
  const { filename } = body;

  try {
    // Adjust the path to where your audio file is located
    const filePath = path.join(process.cwd(), 'path_to_your_audio_files', filename);
    const data = fs.readFileSync(filePath);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/wav2vec2-base-960h",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        body: data,
      }
    );


    const result = await response.json();
 
    return NextResponse.json({result});
  } catch (error) {
    console.error('Error querying Hugging Face API:', error);
    return NextResponse.json({error});
  }
} 
