"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ChatMessage, updateChatMessages, updateChatTitle, createNewChat } from '@/lib/firebase/firebaseUtils';
import ChatHistory from './ChatHistory';
import Banner from './Banner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import MessageInfo from './MessageInfo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ComponentProps } from 'react';
import type { Components } from 'react-markdown';

interface ExtendedChatMessage extends ChatMessage {
  modelInfo?: {
    id: string;
    parameters: Record<string, any>;
    provider: string;
    type: string;
    processingTime?: number;
  };
}

// Add a ThinkingAnimation component
function ThinkingAnimation() {
  return (
    <div className="flex items-center space-x-2 text-gray-400 text-sm">
      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Thinking...</span>
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedModel, setSelectedModel] = useState('deepseek-ai/deepseek-r1');
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isModelThinking, setIsModelThinking] = useState(false);

  const loadChatMessages = async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        // Convert Firestore timestamps to Dates
        const processedMessages = (data.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate() || new Date(msg.timestamp)
        }));
        setMessages(processedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleChatSelect = async (chatId: string) => {
    setCurrentChatId(chatId);
    setInput(''); // Clear input when switching chats
    await loadChatMessages(chatId);
  };

  const handleNewChat = async () => {
    if (user) {
      try {
        const newChatId = await createNewChat(user.uid);
        setCurrentChatId(newChatId);
        setMessages([]); // Clear messages for new chat
        setInput(''); // Clear input for new chat
      } catch (error) {
        console.error('Error creating new chat:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentChatId || !user) return;

    const userMessage: ExtendedChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');
    setIsModelThinking(false);

    const startTime = Date.now();

    try {
      const apiEndpoint = selectedModel === 'deepseek-ai/deepseek-r1' 
        ? '/api/replicate/chat'
        : selectedModel === 'meta/meta-llama-3-70b'
        ? '/api/meta/chat'
        : '/api/google/chat';

      const modelProvider = selectedModel.split('/')[0];
      const modelParameters = {
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        try {
          const parsedChunk = JSON.parse(chunk);
          fullResponse = parsedChunk.output;
          setStreamingContent(fullResponse);
          setIsModelThinking(parsedChunk.isThinking || false);
        } catch (e) {
          console.error('Error parsing chunk:', e);
        }
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      const assistantMessage: ExtendedChatMessage = {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        modelInfo: {
          id: selectedModel,
          parameters: modelParameters,
          provider: modelProvider,
          type: 'chat',
          processingTime
        }
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // Update the chat in Firebase
      await updateChatMessages(currentChatId, updatedMessages);

      // Update the chat title if it's the first message
      if (messages.length === 0) {
        const title = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '');
        await updateChatTitle(currentChatId, title);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
      setIsModelThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Banner selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-gray-100">
          <ChatHistory 
            currentChatId={currentChatId} 
            onChatSelect={handleChatSelect} 
            onNewChat={handleNewChat}
          />
        </div>
        <div className="flex-1 flex flex-col bg-white">
          {!currentChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to PopChat!</h2>
              <p className="text-gray-500 mb-8 max-w-md">Start a new conversation and explore the power of AI with multiple language models.</p>
              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/20 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Start a New Chat
              </button>
            </div>
          ) : loadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500">Loading messages...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-6 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 prose prose-sm max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                              code: ({node, inline, className, children}: any) => {
                                const codeProps = {
                                  className: inline 
                                    ? "px-1 py-0.5 bg-gray-700/10 rounded text-sm"
                                    : "block bg-gray-700/10 p-3 rounded-lg text-sm my-2 whitespace-pre-wrap"
                                };
                                return <code {...codeProps}>{children}</code>;
                              },
                              pre: ({node, ...props}) => <pre className="bg-transparent p-0 my-0" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                              li: ({node, ...props}) => <li className="mb-1" {...props} />,
                              h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2" {...props} />,
                              strong: ({node, ...props}) => (
                                <strong className={`font-bold ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`} {...props} />
                              ),
                              em: ({node, ...props}) => (
                                <em className={`italic ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`} {...props} />
                              ),
                              blockquote: ({node, ...props}) => (
                                <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic" {...props} />
                              ),
                              a: ({node, ...props}) => (
                                <a className={`underline ${message.role === 'user' ? 'text-white' : 'text-blue-600'} hover:opacity-80`} {...props} />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        {message.role === 'assistant' && (
                          <MessageInfo modelInfo={message.modelInfo} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(isLoading || streamingContent) && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] bg-gray-100 rounded-2xl px-6 py-3">
                      {streamingContent ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                              code: ({node, inline, className, children}: any) => {
                                const codeProps = {
                                  className: inline 
                                    ? "px-1 py-0.5 bg-gray-700/10 rounded text-sm"
                                    : "block bg-gray-700/10 p-3 rounded-lg text-sm my-2 whitespace-pre-wrap"
                                };
                                return <code {...codeProps}>{children}</code>;
                              },
                              pre: ({node, ...props}) => <pre className="bg-transparent p-0 my-0" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                              li: ({node, ...props}) => <li className="mb-1" {...props} />,
                              h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                              em: ({node, ...props}) => <em className="italic text-gray-900" {...props} />,
                              blockquote: ({node, ...props}) => (
                                <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic" {...props} />
                              ),
                              a: ({node, ...props}) => (
                                <a className="underline text-blue-600 hover:opacity-80" {...props} />
                              ),
                            }}
                          >
                            {streamingContent}
                          </ReactMarkdown>
                          {isModelThinking && (
                            <div className="mt-2 border-t border-gray-200 pt-2">
                              <ThinkingAnimation />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="px-6 py-3 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/20 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-purple-600"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 