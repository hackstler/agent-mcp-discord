import React from 'react';

interface Props {
  text: string;
  from: 'user' | 'agent';
}

export const MessageBubble: React.FC<Props> = ({ text, from }) => {
  const isUser = from === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} transition-all`}>
      <div
        className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-6 shadow ${
          isUser
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white border border-gray-200 text-gray-900'
        } animate-fadeIn`}
      >
        {text}
      </div>
    </div>
  );
};
