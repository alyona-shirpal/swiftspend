import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DEFAULT_CURRENCY } from '@swiftspend/types';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h1 className="text-4xl font-extrabold text-blue-600 mb-4 tracking-tight">SwiftSpend</h1>
          <p className="text-gray-600 mb-6 text-lg">Your minimal personal expense tracker.</p>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <p className="text-sm text-blue-800 font-medium">
              Base Currency: <span className="font-bold">{DEFAULT_CURRENCY}</span>
            </p>
          </div>
        </div>
      </div>
      <Routes>
        <Route path="/" element={<div />} />
      </Routes>
    </Router>
  );
}

export default App;
