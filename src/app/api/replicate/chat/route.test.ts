import { POST } from './route';
import Replicate from 'replicate';

// Mock Replicate
jest.mock('replicate');

describe('POST /api/replicate/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle streaming response correctly', async () => {
    const mockMessages = [
      { role: 'user', content: 'Hello' }
    ];

    const mockStream = [
      'Hello',
      'how',
      'are',
      'you'
    ];

    (Replicate as jest.Mock).mockImplementation(() => ({
      stream: jest.fn().mockImplementation(async function* () {
        for (const chunk of mockStream) {
          yield chunk;
        }
      })
    }));

    const request = new Request('http://localhost:3000/api/replicate/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages: mockMessages })
    });

    const response = await POST(request);
    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get('Content-Type')).toBe('application/json');

    // Read and parse the streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let receivedData = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedData += decoder.decode(value);
      }
    }

    const parsedData = JSON.parse(receivedData);
    expect(parsedData.output).toBe('Hello how are you');
    expect(parsedData.modelInfo.provider).toBe('DeepSeek');
  });

  it('should handle thinking states correctly', async () => {
    const mockMessages = [
      { role: 'user', content: 'Hello' }
    ];

    const mockStream = [
      'Hello',
      '<think>processing</think>',
      'world'
    ];

    (Replicate as jest.Mock).mockImplementation(() => ({
      stream: jest.fn().mockImplementation(async function* () {
        for (const chunk of mockStream) {
          yield chunk;
        }
      })
    }));

    const request = new Request('http://localhost:3000/api/replicate/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages: mockMessages })
    });

    const response = await POST(request);
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let receivedData = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedData += decoder.decode(value);
      }
    }

    const parsedData = JSON.parse(receivedData);
    expect(parsedData.output).toBe('Hello world');
    expect(parsedData.isThinking).toBe(false);
  });

  it('should handle errors correctly', async () => {
    const mockMessages = [
      { role: 'user', content: 'Hello' }
    ];

    (Replicate as jest.Mock).mockImplementation(() => ({
      stream: jest.fn().mockRejectedValue(new Error('API Error'))
    }));

    const request = new Request('http://localhost:3000/api/replicate/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages: mockMessages })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process request');
  });
}); 