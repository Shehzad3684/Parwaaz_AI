
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GameState, Scenario, CallData, DebriefData, TranscriptionEntry } from './types';
import { SCENARIOS, ALL_SHIFTS } from './constants';
import { GeminiService } from './services/geminiService';
import MainMenu from './components/MainMenu';
import Tutorial from './components/Tutorial';
import CadInterface from './components/CadInterface';
import SupervisorDebrief from './components/SupervisorDebrief';

const SAVE_KEY = 'priorityOneAISaveData';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.MAIN_MENU);
    const [currentShift, setCurrentShift] = useState<number>(1);
    const [tutorialPassed, setTutorialPassed] = useState<boolean>(false);
    const [debriefData, setDebriefData] = useState<DebriefData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
    

    const geminiService = useMemo(() => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            setError("API_KEY environment variable not set.");
            return null;
        }
        return new GeminiService(apiKey);
    }, []);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem(SAVE_KEY);
            if (savedData) {
                const { currentShift: savedShift, tutorialPassed: savedTutorialPassed } = JSON.parse(savedData);
                if (savedShift) setCurrentShift(savedShift);
                if (savedTutorialPassed) setTutorialPassed(savedTutorialPassed);
            }
        } catch (err) {
            console.error("Failed to load game state from localStorage:", err);
            localStorage.removeItem(SAVE_KEY);
        }
    }, []);

    useEffect(() => {
        try {
            const stateToSave = { currentShift, tutorialPassed };
            localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
        } catch (err) {
            console.error("Failed to save game state to localStorage:", err);
        }
    }, [currentShift, tutorialPassed]);

    const handleStartTutorial = useCallback(() => {
        setGameState(GameState.TUTORIAL_INTRO);
    }, []);

    const handleStartTutorialCall = useCallback(() => {
        setCurrentScenario(SCENARIOS.tutorial);
        setGameState(GameState.TUTORIAL_CALL);
    }, []);
    
    const handleStartShift = useCallback(() => {
        const shiftToStart = currentShift > ALL_SHIFTS.length - 1 ? 1 : currentShift;
        const scenarioForShift = ALL_SHIFTS[shiftToStart][0];
        setCurrentScenario(scenarioForShift);
        setCurrentShift(shiftToStart);
        setGameState(GameState.IN_CALL);
    }, [currentShift]);

    const handleEndCall = useCallback(async (transcript: TranscriptionEntry[], callData: CallData) => {
        if (!geminiService || !currentScenario) return;

        setLoading(true);
        setError(null);
        setGameState(GameState.DEBRIEF);

        try {
            const analysis = await geminiService.analyzeCall(transcript, callData, currentScenario);
            const audioBase64 = await geminiService.getSupervisorSpeech(analysis.overallCritique);
            
            setDebriefData({
                score: analysis.score,
                feedback: {
                    responseTime: analysis.responseTime,
                    dispatchAccuracy: analysis.dispatchAccuracy,
                    toneManagement: analysis.toneManagement,
                    protocolAdherence: analysis.protocolAdherence,
                    overallCritique: analysis.overallCritique,
                },
                audioBase64: audioBase64
            });
        } catch (err) {
            setError("Failed to get supervisor debrief. Please try again.");
            console.error(err);
             setDebriefData({
                score: 0,
                feedback: {
                    responseTime: "Analysis failed.",
                    dispatchAccuracy: "Analysis failed.",
                    toneManagement: "Analysis failed.",
                    protocolAdherence: "Analysis failed.",
                    overallCritique: "An error occurred during call analysis.",
                },
                audioBase64: null,
            });
        } finally {
            setLoading(false);
        }
    }, [geminiService, currentScenario]);

    const handleDebriefContinue = useCallback(() => {
        const isTutorial = gameState === GameState.DEBRIEF && currentScenario?.id === 'tutorial';
        
        if (isTutorial) {
            if (debriefData && debriefData.score >= 70) {
                setTutorialPassed(true);
                setGameState(GameState.MAIN_MENU);
            } else {
                setGameState(GameState.TUTORIAL_INTRO);
            }
        } else {
             if (debriefData && debriefData.score >= 50) {
                setCurrentShift(prev => (prev >= 4 ? 4 : prev + 1));
            }
            setGameState(GameState.MAIN_MENU);
        }
        
        setDebriefData(null);
        setCurrentScenario(null);
    }, [debriefData, gameState, currentScenario]);
    
    const handleResetProgress = useCallback(() => {
        if (window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
            localStorage.removeItem(SAVE_KEY);
            setCurrentShift(1);
            setTutorialPassed(false);
            setGameState(GameState.MAIN_MENU);
        }
    }, []);

    const renderContent = () => {
        switch (gameState) {
            case GameState.MAIN_MENU:
                return <MainMenu onStartTutorial={handleStartTutorial} onStartShift={handleStartShift} currentShift={currentShift} tutorialPassed={tutorialPassed} onResetProgress={handleResetProgress} />;
            case GameState.TUTORIAL_INTRO:
                return <Tutorial onStart={handleStartTutorialCall} />;
            case GameState.TUTORIAL_CALL:
            case GameState.IN_CALL:
                if (currentScenario) {
                    return <CadInterface scenario={currentScenario} onEndCall={handleEndCall} />;
                }
                setGameState(GameState.MAIN_MENU);
                return null; 
            case GameState.DEBRIEF:
                return <SupervisorDebrief debriefData={debriefData} loading={loading} onContinue={handleDebriefContinue} />;
            default:
                return <MainMenu onStartTutorial={handleStartTutorial} onStartShift={handleStartShift} currentShift={currentShift} tutorialPassed={tutorialPassed} onResetProgress={handleResetProgress} />;
        }
    };

    return (
        <div className="w-screen h-screen bg-cad-bg-darker font-sans flex items-center justify-center p-2 md:p-4 lg:p-6 relative">
             <div 
                className="absolute inset-0 bg-repeat opacity-10" 
                style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2364ffda\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', animation: 'grid-scroll 60s linear infinite'}}>
            </div>
            <div className="w-full h-full border-2 border-cad-border bg-cad-bg/90 shadow-2xl shadow-cad-primary/20 backdrop-blur-sm flex flex-col">
                {error && <div className="bg-cad-error text-white p-4 text-center text-lg font-bold animate-pulse-red">{error}</div>}
                <div className="flex-grow relative">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default App;