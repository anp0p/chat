"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ChatSession, getUserChats, deleteChat } from '@/lib/firebase/firebaseUtils';

interface ChatHistoryProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => Promise<void>;
}

interface DeleteConfirmationProps {
  isOpen: boolean;
  chatTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmation({ isOpen, chatTitle, onConfirm, onCancel }: DeleteConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Chat</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete &quot;{chatTitle}&quot;? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatHistory({ currentChatId, onChatSelect, onNewChat }: ChatHistoryProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    chatId: string;
    chatTitle: string;
  }>({
    isOpen: false,
    chatId: '',
    chatTitle: ''
  });

  const loadChats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Loading chats for user:', user.uid);
      const userChats = await getUserChats(user.uid);
      
      if (!Array.isArray(userChats)) {
        throw new Error('Invalid chat data received');
      }

      setChats(userChats);
    } catch (error: any) {
      console.error('Error loading chats:', error);
      setError(error.message || 'Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, currentChatId]);

  const handleDeleteClick = (chatId: string, chatTitle: string) => {
    setDeleteConfirmation({
      isOpen: true,
      chatId,
      chatTitle
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteChat(deleteConfirmation.chatId);
      // If the deleted chat was selected, clear the selection
      if (deleteConfirmation.chatId === currentChatId) {
        onChatSelect('');
      }
      await loadChats(); // Reload the chat list
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError('Failed to delete chat');
    } finally {
      setDeleteConfirmation({ isOpen: false, chatId: '', chatTitle: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, chatId: '', chatTitle: '' });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/20 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Chat
        </button>
      </div>

      {error && (
        <div className="mx-4 p-4 bg-red-50 rounded-xl border border-red-100 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2">
        {chats.length === 0 ? (
          <div className="text-center p-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No chat history yet.<br />Start a new conversation!</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative w-full text-left px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white hover:shadow-md ${
                  currentChatId === chat.id 
                    ? 'bg-white shadow-md border-l-4 border-blue-600' 
                    : 'border-l-4 border-transparent'
                }`}
              >
                <button
                  onClick={() => onChatSelect(chat.id)}
                  className="w-full text-left pr-8"
                >
                  <h3 className="font-medium text-gray-900 truncate">
                    {chat.title || 'New Chat'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(chat.updatedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(chat.id, chat.title || 'New Chat');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        chatTitle={deleteConfirmation.chatTitle}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
} 