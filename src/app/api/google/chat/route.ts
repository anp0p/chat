/**
 * API Route: /api/google/chat
 * 
 * This route handles chat interactions with Google's Gemma model hosted on Replicate.
 * It provides non-streaming responses with model information and parameter configuration.
 * 
 * Features:
 * - Direct response (non-streaming)
 * - Configurable model parameters
 * - Detailed model information in responses
 * - Error handling with detailed messages
 * 
 * Model: google-deepmind/gemma-7b
 * Provider: Google DeepMind
 * Version: 2ca65f463a2c0cfef4dbc4ba70d227ed96455ef6020c1f6983b2a4c4f3ecb4ec
 * 
 * Request Body:
 * {
 *   messages: Array<{ role: string, content: string }>
 * }
 * 
 * Response Format:
 * {
 *   output: string,
 *   modelInfo: {
 *     id: string,
 *     parameters: object,
 *     provider: string,
 *     type: string
 *   }
 * }
 */

import Replicate from 'replicate';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    console.log('Gemma API route called');
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    console.log('Last message:', lastMessage);
    
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const input = {
      top_k: 50,
      top_p: 0.95,
      prompt: lastMessage.content,
      temperature: 0.7,
      max_new_tokens: 256,
      min_new_tokens: -1,
      repetition_penalty: 1
    };

    console.log('Starting Gemma request');
    const output = await replicate.run(
      "google-deepmind/gemma-7b:2ca65f463a2c0cfef4dbc4ba70d227ed96455ef6020c1f6983b2a4c4f3ecb4ec",
      { input }
    );
    console.log('Gemma response:', output);

    return new Response(JSON.stringify({ 
      output: output,
      modelInfo: {
        id: "google-deepmind/gemma-7b",
        parameters: input,
        provider: 'Google DeepMind',
        type: 'Language Model'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Gemma API route error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 