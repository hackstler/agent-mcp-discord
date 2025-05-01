import React, { useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { sendMessageToAgent } from '../services/agentApi';

interface Message {
  id: number;
  text: string;
  from: 'user' | 'agent';
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now(), text: input, from: 'user' };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const agentResponse = await sendMessageToAgent(input);
      const agentMessage: Message = { id: Date.now() + 1, text: agentResponse.text, from: 'agent' };
      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error contacting agent:', error);
    }

    setInput('');
  };

  return (
    <div className="flex flex-col w-full max-w-lg h-[90vh] bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 border border-gray-200">
      <header className="px-6 py-5 text-xl font-semibold text-gray-800 border-b border-gray-200">Assistant</header>
  
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} text={msg.text} from={msg.from} />
        ))}
      </div>
  
      <div className="px-6 py-4 bg-white/80 border-t border-gray-200 flex items-center gap-4">
        <input
          type="text"
          className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-500 transition"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className="p-3 bg-gradient-to-tr from-blue-600 to-blue-500 text-white rounded-full hover:from-blue-700 hover:to-blue-600 transition shadow-md"
        >
          Send
        </button>
      </div>
    </div>
  );
};
