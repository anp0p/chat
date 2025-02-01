import { POST } from './route';
import Replicate from 'replicate';

// Mock Replicate
jest.mock('replicate');

describe('POST /api/google/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful response', async () => {
    const mockMessages = [
      { role: 'user', content: 'Hello' }
    ];

    const mockOutput = 'Hello! How can I help you today?';

    (Replicate as jest.Mock).mockImplementation(() => ({
      run: jest.fn().mockResolvedValue(mockOutput)
    }));

    const request = new Request('http://localhost:3000/api/google/chat', {
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
    expect(data.output).toBe(mockOutput);
    expect(data.modelInfo.provider).toBe('Google DeepMind');
    expect(data.modelInfo.id).toBe('google-deepmind/gemma-7b');
  });

  it('should handle API errors', async () => {
    const mockMessages = [
      { role: 'user', content: 'Hello' }
    ];

    (Replicate as jest.Mock).mockImplementation(() => ({
      run: jest.fn().mockRejectedValue(new Error('API Error'))
    }));

    const request = new Request('http://localhost:3000/api/google/chat', {
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
    const request = new Request('http://localhost:3000/api/google/chat', {
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