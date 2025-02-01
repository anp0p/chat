/**
 * API Route: /api/replicate/chat
 * 
 * This route handles chat interactions with the DeepSeek AI model hosted on Replicate.
 * It provides real-time streaming responses with support for thinking states and
 * detailed model information.
 * 
 * Features:
 * - Streaming responses using Edge Runtime
 * - Support for thinking states (<think> tags)
 * - Detailed model information in responses
 * - Error handling and response cleaning
 * 
 * Model: deepseek-ai/deepseek-r1
 * Provider: DeepSeek
 * 
 * Request Body:
 * {
 *   messages: Array<{ role: string, content: string }>
 * }
 * 
 * Response Format:
 * {
 *   output: string,
 *   isThinking: boolean,
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
    console.log('Replicate API route called');
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
      max_tokens: 1000,
      presence_penalty: 0,
      frequency_penalty: 0,
    };

    console.log('Starting Replicate request');
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the Replicate stream
    const replicateStream = await replicate.stream(
      "deepseek-ai/deepseek-r1",
      { input }
    );

    // Process the stream
    (async () => {
      let fullResponse = '';
      let isThinking = false;
      try {
        for await (const chunk of replicateStream) {
          const chunkStr = chunk.toString();
          
          // Check if we're entering a thinking block
          if (chunkStr.includes('<think>')) {
            isThinking = true;
            continue;
          }
          
          // Check if we're exiting a thinking block
          if (chunkStr.includes('</think>')) {
            isThinking = false;
            continue;
          }
          
          // Only add to response if we're not in a thinking block
          if (!isThinking) {
            fullResponse += chunkStr;
          }

          // Send the current state as a JSON string
          const data = JSON.stringify({ 
            output: fullResponse.trim(),
            isThinking,
            modelInfo: {
              id: "deepseek-ai/deepseek-r1",
              parameters: input,
              provider: 'DeepSeek',
              type: 'chat'
            }
          });
          await writer.write(encoder.encode(data));
        }
      } catch (error) {
        console.error('Streaming error:', error);
      } finally {
        // Send one final update with cleaned response
        const finalResponse = fullResponse
          .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove any remaining think tags
          .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
          .trim();

        const finalData = JSON.stringify({
          output: finalResponse,
          isThinking: false,
          modelInfo: {
            id: "deepseek-ai/deepseek-r1",
            parameters: input,
            provider: 'DeepSeek',
            type: 'chat'
          }
        });
        await writer.write(encoder.encode(finalData));
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Replicate API route error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 