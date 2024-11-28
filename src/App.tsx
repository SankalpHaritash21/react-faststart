import React from "react";

const App = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white">
      <h1 className="text-4xl font-bold mb-4">Welcome to Your New Project!</h1>
      <p className="text-lg mb-6 text-center max-w-md">
        This is your starting page. Customize it as you like and build something
        amazing!
      </p>
      <button className="bg-white text-blue-500 px-6 py-3 rounded-full shadow-lg hover:bg-gray-200 transition">
        Get Started
      </button>
    </div>
  );
};

export default App;
