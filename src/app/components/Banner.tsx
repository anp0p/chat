"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface BannerProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const models = [
  { 
    id: 'deepseek-ai/deepseek-r1',
    name: 'DeepSeek',
    fullName: 'DeepSeek-AI R1',
    description: 'A powerful language model optimized for dialogue and reasoning tasks.',
    provider: 'DeepSeek AI',
    parameters: '7B parameters'
  },
  { 
    id: 'meta/meta-llama-3-70b',
    name: 'Meta LLaMA 3',
    fullName: 'Meta LLaMA 3 70B',
    description: 'Latest generation of Meta\'s large language model with enhanced capabilities.',
    provider: 'Meta AI',
    parameters: '70B parameters'
  },
  { 
    id: 'google-deepmind/gemma-7b',
    name: 'Google Gemma',
    fullName: 'Google DeepMind Gemma',
    description: 'Efficient and powerful model from Google DeepMind, optimized for general tasks.',
    provider: 'Google DeepMind',
    parameters: '7B parameters'
  }
];

interface ModelCardProps {
  model: typeof models[0];
  isSelected: boolean;
  onClick: () => void;
}

function ModelCard({ model, isSelected, onClick }: ModelCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border transition-all duration-200 text-left ${
        isSelected 
          ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{model.name}</h3>
          <p className="text-sm text-gray-500 font-mono mt-1">{model.id}</p>
        </div>
        <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
          isSelected 
            ? 'border-blue-500 bg-blue-500' 
            : 'border-gray-300'
        }`}>
          {isSelected && (
            <svg className="text-white" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5L6.5 10.5L4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">{model.description}</p>
      <div className="flex items-center gap-2 mt-3">
        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{model.provider}</span>
        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{model.parameters}</span>
      </div>
    </button>
  );
}

export default function Banner({ selectedModel, onModelChange }: BannerProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const modelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current && 
        !userMenuRef.current.contains(event.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        modelSelectorRef.current && 
        !modelSelectorRef.current.contains(event.target as Node) &&
        modelButtonRef.current &&
        !modelButtonRef.current.contains(event.target as Node)
      ) {
        setIsModelSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const selectedModelInfo = models.find(m => m.id === selectedModel);

  return (
    <div className="bg-white border-b border-gray-100 backdrop-blur-lg bg-white/80 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* App Name */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-2 ring-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-transparent bg-clip-text">
              PopChat
            </h1>
          </div>

          {/* Model Selector */}
          <div className="relative">
            <button
              ref={modelButtonRef}
              onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
              className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-600">Model:</span>
              <span className="text-sm font-medium text-gray-900">{selectedModelInfo?.name}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isModelSelectorOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {isModelSelectorOpen && (
              <div
                ref={modelSelectorRef}
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50"
              >
                <div className="space-y-3">
                  {models.map((model) => (
                    <ModelCard
                      key={model.id}
                      model={model}
                      isSelected={selectedModel === model.id}
                      onClick={() => {
                        onModelChange(model.id);
                        setIsModelSelectorOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Info with Dropdown */}
          {user && (
            <div className="relative">
              <button
                ref={userButtonRef}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-4 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">
                  {user.email}
                </span>
                {user.photoURL ? (
                  <div className="relative">
                    <Image
                      src={user.photoURL}
                      alt="User avatar"
                      width={32}
                      height={32}
                      className="rounded-full ring-2 ring-white shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-white shadow-lg">
                      <span className="text-sm font-medium text-white">
                        {user.email?.[0].toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                )}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  ref={userMenuRef}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50"
                >
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 