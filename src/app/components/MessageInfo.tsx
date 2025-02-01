"use client";

import { useState, useRef, useEffect } from 'react';

interface ModelInfo {
  id: string;
  parameters: Record<string, any>;
  provider: string;
  type: string;
  processingTime?: number;
}

interface MessageInfoProps {
  modelInfo?: ModelInfo;
}

export default function MessageInfo({ modelInfo }: MessageInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!modelInfo) return null;

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        title="Model Information"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
      </button>
      
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute z-50 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-sm"
          style={{
            top: '100%',
            right: '0',
            marginTop: '0.5rem'
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-gray-900">Model Information</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Model:</span>
              <span className="ml-2 text-gray-600">{modelInfo.id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Provider:</span>
              <span className="ml-2 text-gray-600">{modelInfo.provider}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 text-gray-600">{modelInfo.type}</span>
            </div>
            {modelInfo.processingTime && (
              <div>
                <span className="font-medium text-gray-700">Processing Time:</span>
                <span className="ml-2 text-gray-600">
                  {(modelInfo.processingTime / 1000).toFixed(2)}s
                </span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Parameters:</span>
              <pre className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-auto max-h-32">
                {JSON.stringify(modelInfo.parameters, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 