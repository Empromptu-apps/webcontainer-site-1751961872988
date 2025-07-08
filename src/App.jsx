import React, { useState, useEffect } from 'react';
import CheckersGame from './components/CheckersGame';
import ApiDebugger from './components/ApiDebugger';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Checkers Game
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="btn-secondary dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <CheckersGame />
          </div>
          <div className="xl:col-span-1">
            <ApiDebugger />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
