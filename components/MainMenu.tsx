
import React from 'react';

interface MainMenuProps {
  onStartTutorial: () => void;
  onStartShift: () => void;
  onResetProgress: () => void;
  currentShift: number;
  tutorialPassed: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartTutorial, onStartShift, onResetProgress, currentShift, tutorialPassed }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-cad-text p-8 bg-transparent">
      <div className="w-full text-center mt-12 md:mt-24">
        <h1 
            className="font-display text-6xl md:text-8xl text-cad-primary tracking-widest animate-flicker"
            style={{ textShadow: '0 0 10px #64ffda, 0 0 20px #64ffda' }}
        >
            PRIORITY ONE: AI
        </h1>
        <p className="text-xl text-cad-text-dim mt-4">911 Operator Simulator</p>
      </div>
      
      <div className="flex flex-col space-y-6 w-full max-w-md">
        {!tutorialPassed ? (
          <button 
            onClick={onStartTutorial}
            className="w-full bg-transparent hover:bg-cad-primary text-cad-primary hover:text-cad-bg font-bold py-4 px-6 border-2 border-cad-primary transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cad-primary-glow text-xl tracking-widest decorative-border"
            style={{'--corner-color': '#64ffda'} as React.CSSProperties}
          >
            START TUTORIAL
          </button>
        ) : (
          <button
            onClick={onStartShift}
            className="w-full bg-transparent hover:bg-cad-primary text-cad-primary hover:text-cad-bg font-bold py-4 px-6 border-2 border-cad-primary transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cad-primary-glow text-xl tracking-widest decorative-border"
            style={{'--corner-color': '#64ffda'} as React.CSSProperties}
            disabled={currentShift > 4}
          >
            {currentShift > 4 ? "ALL SHIFTS COMPLETE" : `START SHIFT ${currentShift}`}
          </button>
        )}
      </div>

      <div className="w-full text-center mb-4 text-sm text-cad-text-dim">
        <p>Ensure your microphone is enabled. This is a voice-controlled experience.</p>
        <div className="mt-2 flex items-center justify-center space-x-4">
            <span>Built with React & Google Gemini</span>
            <span>|</span>
            <button onClick={onResetProgress} className="text-cad-text-dim hover:text-cad-error underline transition-colors">
                Reset Progress
            </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;