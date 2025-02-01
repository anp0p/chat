import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { POST as ReplicatePost } from '../replicate/chat/route';
import { POST as MetaPost } from '../meta/chat/route';
import { POST as GooglePost } from '../google/chat/route';
import Replicate from 'replicate';
import { NextRequest } from 'next/server';
import { POST as DeepSeekHandler } from '../deepseek/chat/route';
import { POST as MetaHandler } from '../meta/chat/route';
import { POST as GemmaHandler } from '../google/chat/route';
import { POST as ReplicateHandler } from '../replicate/chat/route';

// Create a mock type for Replicate
type MockReplicate = {
  stream: jest.Mock;
  run: jest.Mock;
};

// Mock Replicate
jest.mock('replicate', () => {
  return jest.fn().mockImplementation(() => ({
    stream: jest.fn(),
    run: jest.fn()
  }));
});

describe('AI Model API Routes', () => {
  let mockReplicate: MockReplicate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReplicate = new (Replicate as jest.MockedClass<typeof Replicate>)() as unknown as MockReplicate;
  });

  describe('DeepSeek API', () => {
    it('should handle streaming response correctly', async () => {
      const mockStream = ['Hello', 'how', 'are', 'you'];
      mockReplicate.stream.mockImplementation(async function* () {
        for (const chunk of mockStream) {
          yield chunk;
        }
      });

      const request = new Request('http://localhost:3000/api/replicate/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });

      const response = await ReplicateHandler(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Meta LLaMA API', () => {
    it('should handle streaming response correctly', async () => {
      const mockStream = ['Hello', ' world', '!'];
      mockReplicate.stream.mockImplementation(async function* () {
        for (const chunk of mockStream) {
          yield chunk;
        }
      });

      const request = new Request('http://localhost:3000/api/meta/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });

      const response = await MetaHandler(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Google Gemma API', () => {
    it('should handle successful response', async () => {
      const mockOutput = 'Hello! How can I help you today?';
      mockReplicate.run.mockResolvedValue(mockOutput);

      const request = new Request('http://localhost:3000/api/google/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });

      const response = await GemmaHandler(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      mockReplicate.run.mockRejectedValue(new Error('API Error'));

      const request = new Request('http://localhost:3000/api/google/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });

      const response = await GemmaHandler(request);
      expect(response.status).toBe(500);
    });

    it('should handle invalid request body', async () => {
      const request = new Request('http://localhost:3000/api/meta/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await MetaPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process request');
    });
  });
}); 