'use client';

import { Message, useChat } from 'ai/react';
import { Send, MessageSquare } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const presetPrompts = [
  "What's my current account balance?",
  "Show me my spending trends this month",
  "How can I improve my savings?",
  "Analyze my investment portfolio",
  "What are my largest expenses?",
  "Help me create a budget plan"
];

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showPresets, setShowPresets] = useState(true);

  const initialMessage = {
    id: '1',
    content: "Hello! I'm your WealthWise AI assistant. I can help you understand your finances, analyze your spending patterns, and provide personalized financial advice. Feel free to ask me anything about your financial data!\n\nHere are some things you can ask me about:\n- Account balances and transactions\n- Spending analysis and trends\n- Budget planning and savings strategies\n- Investment portfolio analysis\n- Financial goal setting",
    role: 'assistant'
  } as Message;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([initialMessage]);
    }
  }, []);

  const handlePresetClick = (prompt: string) => {
    setShowPresets(false);
    handleInputChange({ target: { value: prompt } } as any);
    handleSubmit({ preventDefault: () => {} } as any);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-1rem)] bg-white w-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h1 className="text-lg font-semibold text-gray-800">Chat with WealthWise AI</h1>
        </div>
        <button
          onClick={() => {
            setMessages([initialMessage]);
            setShowPresets(true);
          }}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          Clear Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900 border border-gray-200'
              }`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown 
                  components={{
                    // Style links
                    a: ({node, ...props}) => (
                      <a className="text-blue-600 hover:underline" {...props} />
                    ),
                    // Style headings
                    h1: ({node, ...props}) => (
                      <h1 className="text-2xl font-bold mb-4" {...props} />
                    ),
                    h2: ({node, ...props}) => (
                      <h2 className="text-xl font-bold mb-3" {...props} />
                    ),
                    h3: ({node, ...props}) => (
                      <h3 className="text-lg font-bold mb-2" {...props} />
                    ),
                    // Style lists
                    ul: ({node, ...props}) => (
                      <ul className="list-disc list-inside mb-4" {...props} />
                    ),
                    ol: ({node, ...props}) => (
                      <ol className="list-decimal list-inside mb-4" {...props} />
                    ),
                    // Style paragraphs
                    p: ({node, ...props}) => (
                      <p className="mb-4 last:mb-0" {...props} />
                    ),
                    // Style bold text
                    strong: ({node, ...props}) => (
                      <strong className="font-bold text-gray-900" {...props} />
                    ),
                    // Style code blocks
                    code: ({node, ...props}) => (
                      <code className="bg-gray-100 rounded px-1 py-0.5" {...props} />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        {showPresets && messages.length === 1 && (
          <div className="grid grid-cols-2 gap-4 mt-8">
            {presetPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePresetClick(prompt)}
                className="p-4 bg-gray-100 rounded-lg text-left hover:bg-gray-200 transition-colors border border-gray-200 text-gray-900"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything about your finances..."
            className="flex-1 rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg bg-blue-500 text-white flex items-center space-x-2 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}