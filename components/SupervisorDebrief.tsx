
import React, { useEffect, useState, useMemo } from 'react';
import { DebriefData } from '../types';
import { useAudio } from '../hooks/useAudio';

interface SupervisorDebriefProps {
  debriefData: DebriefData | null;
  loading: boolean;
  onContinue: () => void;
}

const DebriefMetric: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
    <div className="bg-cad-bg-darker/50 p-4 border border-cad-border rounded-lg">
        <h4 className="text-md text-cad-primary font-bold uppercase tracking-widest mb-2">{label}</h4>
        <p className="text-cad-text-dim text-lg">{value}</p>
    </div>
);


const SupervisorDebrief: React.FC<SupervisorDebriefProps> = ({ debriefData, loading, onContinue }) => {
    const { playAudio, isPlaying } = useAudio(24000);
    const [analysisStatus, setAnalysisStatus] = useState('PARSING TRANSCRIPT...');

    const analysisSteps = useMemo(() => [
        'PARSING TRANSCRIPT...',
        'ANALYZING VOCAL TONALITY...',
        'CROSS-REFERENCING DISPATCH PROTOCOLS...',
        'EVALUATING UNIT SELECTION...',
        'FINALIZING FTO MILLER\'S REPORT...'
    ], []);

    useEffect(() => {
        if (debriefData?.audioBase64) {
            playAudio(debriefData.audioBase64);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debriefData?.audioBase64]);

     useEffect(() => {
        if (loading) {
            let step = 0;
            const intervalId = setInterval(() => {
                step = (step + 1) % analysisSteps.length;
                setAnalysisStatus(analysisSteps[step]);
            }, 1800);

            return () => clearInterval(intervalId);
        }
    }, [loading, analysisSteps]);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-cad-text p-8 font-sans relative overflow-hidden bg-cad-bg">
                <div className="absolute top-4 left-4 text-sm text-cad-primary opacity-50">
                    <p>STATUS: LIVE ANALYSIS</p>
                    <p>FTO: MILLER, J.</p>
                </div>
                
                <div className="absolute bottom-4 right-4 text-sm text-cad-primary text-right opacity-50">
                    <p>CALL ID: #{Math.floor(Date.now()/1000)}</p>
                    <p>SESSION: ACTIVE</p>
                </div>

                <div className="text-center">
                    <h2 className="font-display text-4xl md:text-5xl text-cad-primary mb-12 tracking-widest animate-pulse">
                        PERFORMANCE ANALYSIS IN PROGRESS
                    </h2>
                    
                    <div className="w-full max-w-2xl mx-auto my-8 p-4 border-2 border-cad-border bg-cad-bg-darker decorative-border">
                        <p className="text-cad-primary text-2xl tracking-wider">{analysisStatus}<span className="animate-blink">_</span></p>
                    </div>

                    <div className="w-full max-w-3xl mx-auto h-2 bg-cad-border/50 overflow-hidden mt-12 relative">
                       <div className="absolute top-0 left-0 h-full w-1/2 bg-cad-primary animate-progress"></div>
                    </div>

                    <p className="text-cad-text-dim mt-8 text-lg">
                        Your performance is being evaluated against department protocols. Please stand by.
                    </p>
                </div>
            </div>
        );
    }
    
    if (!debriefData) {
         return (
            <div className="w-full h-full flex flex-col items-center justify-center text-cad-text p-8">
                <h2 className="font-display text-4xl text-cad-error">ANALYSIS FAILED</h2>
                <button onClick={onContinue} className="mt-8 bg-cad-primary/80 hover:bg-cad-primary text-cad-bg font-bold py-3 px-8 rounded-md text-lg">
                    CONTINUE
                </button>
            </div>
        );
    }

    const scoreColor = debriefData.score >= 70 ? 'text-green-400' : debriefData.score >= 50 ? 'text-yellow-400' : 'text-red-500';
    const scoreGlow = debriefData.score >= 70 ? 'shadow-green-400/50' : debriefData.score >= 50 ? 'shadow-yellow-400/50' : 'shadow-red-500/50';

    return (
        <div className="w-full h-full flex flex-col text-cad-text p-4 md:p-8 overflow-y-auto">
            <div className="text-center mb-6">
                <h1 className="font-display text-5xl text-cad-primary mb-2 tracking-wider">AFTER-ACTION REVIEW</h1>
                <h2 className="text-2xl text-cad-text-dim">Performance Debrief</h2>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col items-center justify-center bg-cad-bg-darker/50 p-6 rounded-lg border-2 border-cad-border">
                    <h3 className="text-xl text-cad-text-dim mb-4 uppercase tracking-widest">Overall Score</h3>
                    <div 
                        className={`w-48 h-48 rounded-full border-8 ${scoreColor.replace('text-', 'border-')} flex items-center justify-center my-4 shadow-2xl ${scoreGlow}`}
                    >
                        <p className={`font-display text-7xl font-bold ${scoreColor}`}>{debriefData.score}</p>
                    </div>
                    <p className="text-cad-text-dim text-lg">/ 100</p>
                </div>

                <div className="lg:col-span-2 space-y-4">
                   <DebriefMetric label="Response Time" value={debriefData.feedback.responseTime} />
                   <DebriefMetric label="Dispatch Accuracy" value={debriefData.feedback.dispatchAccuracy} />
                   <DebriefMetric label="Tone Management" value={debriefData.feedback.toneManagement} />
                   <DebriefMetric label="Protocol Adherence" value={debriefData.feedback.protocolAdherence} />
                </div>
            </div>

            <div className="mt-6 bg-cad-bg-darker/50 p-6 border border-cad-border rounded-lg decorative-border" style={{'--border-color': '#ffda64', '--corner-color': '#ffda64'} as React.CSSProperties}>
                 <h3 className="text-cad-warn font-bold text-2xl mb-3">FTO MILLER'S CRITIQUE</h3>
                 <p className="text-xl italic">"{debriefData.feedback.overallCritique}"</p>
            </div>
            
            <div className="text-center mt-8">
                <button 
                    onClick={onContinue} 
                    disabled={isPlaying}
                    className="bg-cad-primary/80 hover:bg-cad-primary text-cad-bg font-bold py-3 px-10 rounded-md text-xl transition-all duration-300 transform hover:scale-105 disabled:bg-cad-text-dim disabled:cursor-not-allowed"
                >
                    {isPlaying ? 'DEBRIEF IN PROGRESS...' : 'CONTINUE'}
                </button>
            </div>
        </div>
    );
};

export default SupervisorDebrief;