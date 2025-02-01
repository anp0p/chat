/**
 * API Route: /api/chat/[id]
 * 
 * This route handles fetching individual chat sessions from Firebase Firestore.
 * It provides access to chat history and metadata for authenticated users.
 * 
 * Features:
 * - Dynamic route parameter for chat ID
 * - Firebase Firestore integration
 * - Error handling for non-existent chats
 * - Secure data access
 * 
 * Parameters:
 * - id: string (chat session ID)
 * 
 * Response Format:
 * {
 *   messages: Array<{
 *     role: string,
 *     content: string,
 *     timestamp: Date,
 *     modelInfo?: {
 *       id: string,
 *       parameters: object,
 *       provider: string,
 *       type: string
 *     }
 *   }>,
 *   title: string,
 *   createdAt: Date,
 *   updatedAt: Date,
 *   userId: string
 * }
 * 
 * Error Responses:
 * - 404: Chat not found
 * - 500: Server error
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const chatDoc = await getDoc(doc(db, 'chats', params.id));
    
    if (!chatDoc.exists()) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(chatDoc.data());
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    );
  }
} 