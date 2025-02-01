import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GET } from '../chat/[id]/route';
import { NextResponse } from 'next/server';
import { getDoc, DocumentSnapshot, DocumentData } from 'firebase/firestore';

// Mock Firebase modules
const mockGetDoc = jest.fn();
jest.mock('firebase/firestore', () => ({
  getDoc: () => mockGetDoc(),
  doc: jest.fn()
}));

// Mock NextResponse
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: jest.fn().mockImplementation((data: any, init?: ResponseInit) => {
        return new Response(JSON.stringify(data), init);
      })
    }
  };
});

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

    const mockDocSnap = {
      exists: () => true,
      data: () => mockChatData,
      id: 'test-id'
    } as unknown as DocumentSnapshot<DocumentData>;

    mockGetDoc.mockResolvedValueOnce(mockDocSnap);

    const response = await GET({} as Request, {
      params: { id: 'test-id' }
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockChatData);
  });

  it('should return 404 when chat does not exist', async () => {
    const mockDocSnap = {
      exists: () => false,
      id: 'test-id'
    } as unknown as DocumentSnapshot<DocumentData>;

    mockGetDoc.mockResolvedValueOnce(mockDocSnap);

    const response = await GET({} as Request, {
      params: { id: 'non-existent-id' }
    } as any);

    expect(response.status).toBe(404);
  });

  it('should return 500 on server error', async () => {
    mockGetDoc.mockRejectedValueOnce(new Error('Test error'));

    const response = await GET({} as Request, {
      params: { id: 'test-id' }
    } as any);

    expect(response.status).toBe(500);
  });
}); 