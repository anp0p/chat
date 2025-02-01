import { POST } from './route';
import Replicate from 'replicate';

// Mock Replicate
jest.mock('replicate');

describe('POST /api/meta/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle streaming response correctly', async () => {
    const mockMessages = [
      { role: 'user', content: 'Hello' }
    ];

    const mockStream = [
      'Hello',
      ' world',
      '!'
    ];

    (Replicate as jest.Mock).mockImplementation(() => ({
      stream: jest.fn().mockImplementation(async function* () {
        for (const chunk of mockStream) {
          yield chunk;
        }
      })
    }));

    const request = new Request('http://localhost:3000/api/meta/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages: mockMessages })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(data.output).toBe('Hello world!');
    expect(data.modelInfo.provider).toBe('Meta');
    expect(data.modelInfo.id).toBe('meta/meta-llama-3-70b');
  });

  it('should handle streaming errors correctly', async () => {
    const mockMessages = [
      { role: 'user', content: 'Hello' }
    ];

    (Replicate as jest.Mock).mockImplementation(() => ({
      stream: jest.fn().mockImplementation(async function* () {
        throw new Error('Streaming error');
      })
    }));

    const request = new Request('http://localhost:3000/api/meta/chat', {
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

  it('should handle invalid request body', async () => {
    const request = new Request('http://localhost:3000/api/meta/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: 'invalid json'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process request');
  });
}); 