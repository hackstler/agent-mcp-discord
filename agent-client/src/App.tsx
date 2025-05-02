import React from 'react';
import { Chat } from './components/Chat';

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <Chat />
    </div>
  );
};

export default App;
