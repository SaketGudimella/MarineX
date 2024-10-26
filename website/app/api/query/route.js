
import { NextResponse } from 'next/server';

async function readFormData(req) {
  const formData = await req.formData();
  const file = formData.get('file');
  if (!file) {
    throw new Error('No file provided');
  }
  return file;
}

async function fileToArrayBuffer(file) {
  const bytes = await file.arrayBuffer();
  return bytes;
}

export async function POST(req) {
  try {
    // Get the uploaded file from form data
    const file = await readFormData(req);
    
    // Convert file to array buffer
    const audioData = await fileToArrayBuffer(file);

    // Create headers for Hugging Face API
    const headers = new Headers({
      'Authorization': 'Bearer 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',
      'Content-Type': 'audio/wav',  // Adjust content type based on your audio format
    });

    // Make request to Hugging Face
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/wav2vec2-base-960h",
      {
        method: "POST",
        headers: headers,
        body: audioData,
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    return NextResponse.json(
      { success: true, result },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing audio:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An error occurred while processing the audio file' 
      },
      { status: 500 }
    );
  }
}

