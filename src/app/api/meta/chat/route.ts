/**
 * API Route: /api/meta/chat
 * 
 * This route handles chat interactions with Meta's LLaMA 3 model hosted on Replicate.
 * It provides streaming responses with accumulated output and model information.
 * 
 * Features:
 * - Streaming response accumulation
 * - Advanced parameter configuration
 * - Custom prompt templating
 * - Performance metrics logging (optional)
 * 
 * Model: meta/meta-llama-3-70b
 * Provider: Meta
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
 * 
 * Note: This implementation uses a 70B parameter model with
 * carefully tuned parameters for optimal response quality.
 */

import Replicate from 'replicate';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    console.log('Meta LLaMA API route called');
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    console.log('Last message:', lastMessage);
    
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const input = {
      top_k: 0,
      top_p: 0.9,
      prompt: lastMessage.content,
      max_tokens: 512,
      min_tokens: 0,
      temperature: 0.6,
      length_penalty: 1,
      stop_sequences: "<|end_of_text|>",
      prompt_template: "{prompt}",
      presence_penalty: 1.15,
      log_performance_metrics: false
    };

    console.log('Starting Meta LLaMA request');
    let fullResponse = '';
    
    try {
      for await (const event of replicate.stream("meta/meta-llama-3-70b", { input })) {
        fullResponse += event.toString();
      }
    } catch (streamError) {
      console.error('Streaming error:', streamError);
      throw new Error('Failed to stream response');
    }

    console.log('Meta LLaMA response:', fullResponse);

    return new Response(JSON.stringify({ 
      output: fullResponse,
      modelInfo: {
        id: "meta/meta-llama-3-70b",
        parameters: input,
        provider: 'Meta',
        type: 'Language Model'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Meta LLaMA API route error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 