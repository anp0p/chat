import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GET } from '../chat/[id]/route';
import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore');

// Mock NextResponse
const mockNextResponse = {
  json: (data: any, init?: ResponseInit) => {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {})
      }
    });
  }
};

jest.mock('next/server', () => ({
  NextResponse: mockNextResponse
}));

describe('GET /api/chat/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return chat data when chat exists', async () => {
    const mockChatData = {
      id: 'test-id',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockDocSnapshot = {
      exists: () => true,
      data: () => mockChatData
    };

    (getDoc as jest.MockedFunction<typeof getDoc>).mockResolvedValue(mockDocSnapshot as any);

    const request = new Request('http://localhost:3000/api/chat/test-id');
    const response = await GET(request, { params: { id: 'test-id' } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockChatData);
  });

  it('should return 404 when chat does not exist', async () => {
    const mockDocSnapshot = {
      exists: () => false
    };

    (getDoc as jest.MockedFunction<typeof getDoc>).mockResolvedValue(mockDocSnapshot as any);

    const request = new Request('http://localhost:3000/api/chat/test-id');
    const response = await GET(request, { params: { id: 'test-id' } });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: 'Chat not found' });
  });

  it('should return 500 on server error', async () => {
    (getDoc as jest.MockedFunction<typeof getDoc>).mockRejectedValue(new Error('Database error'));

    const request = new Request('http://localhost:3000/api/chat/test-id');
    const response = await GET(request, { params: { id: 'test-id' } });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Failed to fetch chat' });
  });
}); 