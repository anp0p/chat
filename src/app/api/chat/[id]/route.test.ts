import { GET } from './route';
import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase/firebase', () => ({
  db: {}
}));

describe('GET /api/chat/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return chat data when chat exists', async () => {
    const mockChatData = {
      messages: [],
      title: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'test-user'
    };

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockChatData
    });

    const request = new Request('http://localhost:3000/api/chat/test-id');
    const response = await GET(request, { params: { id: 'test-id' } });
    const data = await response.json();

    expect(response).toBeInstanceOf(NextResponse);
    expect(data).toEqual(mockChatData);
    expect(getDoc).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should return 404 when chat does not exist', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false
    });

    const request = new Request('http://localhost:3000/api/chat/non-existent');
    const response = await GET(request, { params: { id: 'non-existent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Chat not found' });
  });

  it('should return 500 on server error', async () => {
    (getDoc as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new Request('http://localhost:3000/api/chat/test-id');
    const response = await GET(request, { params: { id: 'test-id' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch chat' });
  });
}); 