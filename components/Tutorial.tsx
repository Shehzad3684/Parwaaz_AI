
import React, { useState } from 'react';
import { MapPin, AlertTriangle, Users, Clock, Shield, HelpCircle } from './icons'; // Using custom icons

const SixW: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
    <div className="bg-cad-bg p-4 rounded-lg border border-cad-border transform hover:scale-105 hover:border-cad-primary transition-all duration-300">
        <div className="flex items-center mb-2">
            <div className="text-cad-primary mr-3">{icon}</div>
            <h3 className="text-cad-primary font-bold text-lg tracking-wider">{title}</h3>
        </div>
        <p className="text-cad-text-dim text-base pl-8">{description}</p>
    </div>
);

const QUIZ_QUESTIONS = [
    {
        question: "What is the most critical piece of information to obtain first in any emergency call?",
        options: ["The caller's name", "The address of the emergency", "The time of day"],
        correctAnswer: "The address of the emergency",
        explanation: "Correct. Without a location, we can't send help. The 'WHERE' is always your first priority."
    },
    {
        question: "When dealing with a potentially violent situation, which 'W' is critical for responding officer safety?",
        options: ["When", "Why", "Weapons"],
        correctAnswer: "Weapons",
        explanation: "Correct. Knowing if weapons are involved changes the entire police response and is vital for safety."
    },
    {
        question: "Your caller is highly distressed and panicking. What is the most effective tone management strategy?",
        options: ["Match their panicked tone to show empathy", "Speak in a calm, clear, and reassuring voice", "Tell them to hang up and call back when they've calmed down"],
        correctAnswer: "Speak in a calm, clear, and reassuring voice",
        explanation: "Correct. Your calm demeanor helps de-escalate the situation and allows the caller to focus on providing critical information."
    }
];

const Tutorial: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    const [step, setStep] = useState<'intro' | 'example' | 'quiz' | 'ready'>('intro');
    const [answers, setAnswers] = useState<(string | null)[]>(Array(QUIZ_QUESTIONS.length).fill(null));
    const [submitted, setSubmitted] = useState(false);

    const handleAnswerChange = (questionIndex: number, answer: string) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = answer;
        setAnswers(newAnswers);
        setSubmitted(false);
    };

    const handleSubmitQuiz = () => {
        setSubmitted(true);
        const allCorrect = answers.every((ans, i) => ans === QUIZ_QUESTIONS[i].correctAnswer);
        if (allCorrect) {
            setTimeout(() => setStep('ready'), 2000);
        }
    };

    const isQuizPassed = answers.every((ans, i) => ans === QUIZ_QUESTIONS[i].correctAnswer);

    const renderIntro = () => (
        <>
            <div className="bg-cad-bg-darker/50 p-6 border border-cad-border rounded-lg mb-8 decorative-border" style={{'--border-color': '#ffda64', '--corner-color': '#ffda64'} as React.CSSProperties}>
                <h3 className="text-cad-warn font-bold text-2xl mb-2">Your Objective</h3>
                <p className="text-lg">Your primary goal is to gather critical information quickly and accurately while managing the caller's emotional state. Your performance will be evaluated on speed, accuracy, and professionalism. Every second counts.</p>
            </div>
            <div className="bg-cad-bg-darker/50 p-6 border border-cad-border rounded-lg decorative-border">
                <h3 className="text-cad-primary font-bold text-2xl mb-4">The Six W's of Dispatch</h3>
                <p className="text-lg text-cad-text-dim mb-6">This is the foundation of every call. You must obtain this information.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SixW title="WHERE" description="The location of the emergency. This is the #1 priority." icon={<MapPin />} />
                    <SixW title="WHAT" description="The nature of the emergency (e.g., fire, intruder, medical)." icon={<AlertTriangle />} />
                    <SixW title="WHO" description="Who is involved? Caller, victim, suspect details." icon={<Users />} />
                    <SixW title="WHEN" description="When did this happen? Is it in progress?" icon={<Clock />} />
                    <SixW title="WEAPONS" description="Are there any weapons involved? Critical for officer safety." icon={<Shield />} />
                    <SixW title="WHY" description="What led to the incident? (Less critical, but can provide context)." icon={<HelpCircle />} />
                </div>
            </div>
            <div className="text-center mt-10">
                <button onClick={() => setStep('example')} className="bg-cad-primary/80 hover:bg-cad-primary text-cad-bg font-bold py-3 px-8 rounded-md text-lg transition-transform transform hover:scale-105">
                    Next: See an Example
                </button>
            </div>
        </>
    );
    
     const renderExample = () => (
         <>
            <div className="bg-cad-bg-darker/50 p-6 border border-cad-border rounded-lg mb-8 decorative-border" style={{'--border-color': '#ffda64', '--corner-color': '#ffda64'} as React.CSSProperties}>
                <h3 className="text-cad-warn font-bold text-2xl mb-2">Simulation Briefing: "Welfare Check"</h3>
                <p className="text-lg mb-2">You will receive a call from a citizen concerned about their neighbor. The caller is calm but worried.</p>
                <p className="text-lg"><span className="font-bold">Your Goal:</span> Reassure the caller, obtain the neighbor's address, understand the reason for concern, and dispatch a Police unit to check on them.</p>
            </div>
            <div className="bg-cad-bg-darker/50 p-6 border border-cad-border rounded-lg decorative-border">
                <h3 className="text-cad-primary font-bold text-2xl mb-4">Example Transcript</h3>
                <div className="font-mono text-lg space-y-3 p-4 bg-black/30 rounded">
                    <p><span className="text-cad-warn">OPERATOR:</span> 911, what is the address of the emergency?</p>
                    <p><span className="text-cad-text-dim">CALLER:</span> Oh, hello. It's not really an emergency... I'm just worried about my neighbor. The address is 123 Maple Street.</p>
                    <p><span className="text-cad-warn">OPERATOR:</span> Okay, 123 Maple Street. Thank you. Can you tell me what's making you concerned?</p>
                    <p><span className="text-cad-text-dim">CALLER:</span> I haven't seen him in three days, and his newspaper is still on the porch. That's not like him.</p>
                    <p><span className="text-cad-warn">OPERATOR:</span> I understand. We can send an officer to check. What is your neighbor's name?</p>
                </div>
            </div>
            <div className="text-center mt-10">
                <button onClick={() => setStep('quiz')} className="bg-cad-primary/80 hover:bg-cad-primary text-cad-bg font-bold py-3 px-8 rounded-md text-lg transition-transform transform hover:scale-105">
                    Next: Protocol Quiz
                </button>
            </div>
        </>
    );

    const renderQuiz = () => (
        <>
            <div className="bg-cad-bg-darker/50 p-6 border border-cad-border rounded-lg mb-8 text-center decorative-border">
                <h3 className="text-cad-warn font-bold text-2xl">Protocol Quiz</h3>
                <p className="text-lg">Answer all questions correctly to proceed to the simulation.</p>
            </div>
            <div className="space-y-8">
                {QUIZ_QUESTIONS.map((q, index) => (
                    <div key={index} className="bg-cad-bg-darker/50 border border-cad-border p-6 rounded-lg decorative-border">
                        <p className="font-bold text-xl mb-4">{index + 1}. {q.question}</p>
                        <div className="space-y-3">
                            {q.options.map(option => {
                                const isSelected = answers[index] === option;
                                const isCorrect = q.correctAnswer === option;
                                let buttonClass = "w-full text-left p-3 rounded border-2 border-cad-border hover:border-cad-primary hover:bg-cad-primary/10 transition-all text-lg";
                                if (submitted && isSelected) {
                                    buttonClass = isCorrect ? "bg-green-500/30 border-green-400" : "bg-red-500/30 border-red-400";
                                } else if (isSelected) {
                                    buttonClass = "border-cad-primary bg-cad-primary/20";
                                }
                                return (
                                    <button key={option} onClick={() => handleAnswerChange(index, option)} className={buttonClass}>
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                        {submitted && answers[index] && answers[index] !== q.correctAnswer && <p className="text-red-400 text-md mt-3 font-bold">Incorrect. Please review the Six W's and try again.</p>}
                        {submitted && answers[index] === q.correctAnswer && <p className="text-green-400 text-md mt-3 font-bold">{q.explanation}</p>}
                    </div>
                ))}
            </div>
            <div className="text-center mt-10">
                <button onClick={handleSubmitQuiz} className="bg-cad-warn/80 hover:bg-cad-warn text-cad-bg font-bold py-3 px-8 rounded-md text-lg">
                    Submit Answers
                </button>
                {submitted && isQuizPassed && <p className="text-green-400 mt-4 font-bold text-xl">Protocol Quiz Passed! Preparing simulation...</p>}
            </div>
        </>
    );

    const renderReady = () => (
        <div className="text-center bg-cad-bg-darker/50 p-10 border-2 border-cad-primary rounded-lg decorative-border" style={{boxShadow: '0 0 20px #64ffda80'} as React.CSSProperties}>
             <h3 className="text-cad-primary font-bold text-4xl mb-6">Training Complete</h3>
             <p className="text-cad-text-dim text-xl mb-4">You are ready for your first simulation: A "Welfare Check".</p>
             <p className="text-cad-text-dim text-xl mb-6">Your goal: Calm the caller, extract the address, and dispatch Police.</p>
             <p className="text-cad-warn font-bold text-xl mb-8">Remember: A score of 70 or higher is required to proceed to active duty.</p>
            <button
                onClick={onStart}
                className="bg-cad-primary hover:bg-green-400 text-cad-bg font-bold py-4 px-10 rounded-md transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cad-primary/30 text-2xl tracking-widest"
            >
                START SIMULATION
            </button>
        </div>
    );
    
    const renderContent = () => {
        switch (step) {
            case 'intro': return renderIntro();
            case 'example': return renderExample();
            case 'quiz': return renderQuiz();
            case 'ready': return renderReady();
            default: return renderIntro();
        }
    }

    return (
        <div className="w-full h-full flex flex-col items-center text-cad-text p-4 md:p-8">
            <div className="text-center mb-8">
                <h1 className="font-display text-5xl text-cad-primary tracking-widest">TRAINING MODULE: 01</h1>
                <h2 className="text-3xl text-cad-text-dim mt-2">
                    {step === 'intro' && 'Operator Best Practices'}
                    {step === 'example' && 'Call Example & Briefing'}
                    {step === 'quiz' && 'Protocol Assessment'}
                    {step === 'ready' && 'Simulation Ready'}
                </h2>
            </div>

            <div className="max-w-5xl w-full flex-grow overflow-y-auto p-4 custom-scrollbar">
               {renderContent()}
            </div>
        </div>
    );
};

export default Tutorial;
