import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Scenario, CallData, TranscriptionEntry, UnitType, MapUnit, Location } from '../types';
import { PoliceIcon, FireIcon, EmsIcon, SwatIcon, MicIcon, PhoneIcon } from './icons';
import Map from './Map';

// Audio utility functions
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function decode(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

const CadInterface: React.FC<{ scenario: Scenario; onEndCall: (transcript: TranscriptionEntry[], callData: CallData) => void }> = ({ scenario, onEndCall }) => {
    const [callData, setCallData] = useState<CallData>({ address: '', description: '', notes: '', dispatchedUnits: [] });
    const [transcript, setTranscript] = useState<TranscriptionEntry[]>([]);
    const [callStatus, setCallStatus] = useState<'INCOMING' | 'ACTIVE' | 'ENDED'>('INCOMING');
    const [session, setSession] = useState<any | null>(null);
    const [isMicActive, setIsMicActive] = useState(false);
    const [isCallerSpeaking, setIsCallerSpeaking] = useState(false);
    const [callerLocation, setCallerLocation] = useState<Location | null>(null);
    const [mapUnits, setMapUnits] = useState<MapUnit[]>([]);

    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Generate a consistent random location for the duration of the call
    const callLocationRef = useRef<Location | null>(null);
    if (!callLocationRef.current) {
        callLocationRef.current = {
            x: Math.random() * 60 + 20, // Avoid edges
            y: Math.random() * 60 + 20,
        };
    }

    const handleCallDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCallData(prev => ({ ...prev, [name]: value }));
        
        // When user starts typing an address, "verify" it and show on map
        if (name === 'address' && value.length > 0 && !callerLocation) {
             setCallerLocation(callLocationRef.current);
        }
        if (name === 'address' && value.length === 0) {
            setCallerLocation(null);
        }
    };

    const toggleDispatch = (unitType: UnitType) => {
        const isDispatched = callData.dispatchedUnits.includes(unitType);

        setCallData(prev => {
            const newUnits = isDispatched
                ? prev.dispatchedUnits.filter(u => u !== unitType)
                : [...prev.dispatchedUnits, unitType];
            return { ...prev, dispatchedUnits: newUnits };
        });

        if (!isDispatched) {
            // Add unit to map
            const startPositions = [
                { x: Math.random() * 100, y: -5 }, // Top
                { x: 105, y: Math.random() * 100 }, // Right
                { x: Math.random() * 100, y: 105 }, // Bottom
                { x: -5, y: Math.random() * 100 }, // Left
            ];
            const startPos = startPositions[Math.floor(Math.random() * 4)];
            const newUnit: MapUnit = {
                id: `${unitType}-${Date.now()}`,
                type: unitType,
                x: startPos.x,
                y: startPos.y,
                status: 'enroute',
            };
            setMapUnits(prev => [...prev, newUnit]);
        } else {
            // Remove unit from map
            setMapUnits(prev => prev.filter(u => !u.id.startsWith(unitType)));
        }
    };

    // Unit movement simulation
    useEffect(() => {
        const moveInterval = setInterval(() => {
            if (!callerLocation) return;

            setMapUnits(currentUnits => {
                return currentUnits.map(unit => {
                    if (unit.status === 'onscene') return unit;

                    const dx = callerLocation.x - unit.x;
                    const dy = callerLocation.y - unit.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 5) { // Arrived
                        return { ...unit, status: 'onscene' };
                    }
                    
                    // Move 3% of the distance each tick
                    const moveX = dx * 0.03; 
                    const moveY = dy * 0.03;

                    return {
                        ...unit,
                        x: unit.x + moveX,
                        y: unit.y + moveY,
                    };
                });
            });
        }, 100); // update every 100ms

        return () => clearInterval(moveInterval);
    }, [callerLocation]);

    const answerCall = useCallback(async () => {
        if (!process.env.API_KEY) {
            alert("API key not configured.");
            return;
        }

        setCallStatus('ACTIVE');
        setIsMicActive(true);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
            outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
            
            // Resume audio contexts on user gesture
            await inputAudioContextRef.current.resume();
            await outputAudioContextRef.current.resume();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        if (!inputAudioContextRef.current) return;
                        const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromise.then((s) => s.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setTranscript(prev => {
                                const last = prev[prev.length -1];
                                if(last?.speaker === 'user') {
                                    const newLast = {...last, text: last.text + text};
                                    return [...prev.slice(0, -1), newLast];
                                }
                                return [...prev, { speaker: 'user', text }];
                            });
                        }
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                             setTranscript(prev => {
                                const last = prev[prev.length -1];
                                if(last?.speaker === 'caller') {
                                    const newLast = {...last, text: last.text + text};
                                    return [...prev.slice(0, -1), newLast];
                                }
                                return [...prev, { speaker: 'caller', text }];
                            });
                        }

                        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            setIsCallerSpeaking(true);
                            const outputCtx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            
                            source.onended = () => {
                                sourcesRef.current.delete(source);
                                if (sourcesRef.current.size === 0) {
                                    setIsCallerSpeaking(false);
                                }
                            };
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => console.error("Session error:", e),
                    onclose: (e: CloseEvent) => {
                        setIsMicActive(false);
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: scenario.systemInstruction,
                },
            });
            
            const activeSession = await sessionPromise;
            setSession(activeSession);

        } catch (error) {
            console.error("Failed to start call:", error);
            setCallStatus('INCOMING');
            setIsMicActive(false);
        }
    }, [scenario.systemInstruction]);

    const endCall = useCallback(() => {
        session?.close();
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        scriptProcessorRef.current?.disconnect();

        setCallStatus('ENDED');
        setIsMicActive(false);
        onEndCall(transcript, callData);
    }, [session, onEndCall, transcript, callData]);
    
     useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    return (
        <div className="w-full h-full grid grid-cols-5 grid-rows-6 gap-2 p-2 bg-black">
            <div className="col-span-3 row-span-4 bg-cad-bg border border-cad-border p-2 flex flex-col">
                <h2 className="text-cad-primary font-bold border-b border-cad-border pb-1 mb-2">LIVE TRANSCRIPT</h2>
                <div className="flex-grow overflow-y-auto pr-2 text-sm">
                   {transcript.map((t, i) => (
                       <p key={i} className={t.speaker === 'user' ? 'text-cad-warn' : 'text-cad-text'}>
                           <span className="font-bold">{t.speaker.toUpperCase()}: </span>{t.text}
                       </p>
                   ))}
                   <div ref={transcriptEndRef} />
                </div>
                 <div className="border-t border-cad-border pt-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                         <MicIcon className={`w-5 h-5 ${isMicActive ? 'text-cad-primary animate-pulse' : 'text-cad-text-dim'}`} />
                         <span className={isMicActive ? 'text-cad-primary' : 'text-cad-text-dim'}>MIC {isMicActive ? 'LIVE' : 'OFF'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <PhoneIcon className={`w-5 h-5 ${isCallerSpeaking ? 'text-cad-primary animate-pulse' : 'text-cad-text-dim'}`} />
                         <span className={isCallerSpeaking ? 'text-cad-primary' : 'text-cad-text-dim'}>CALLER {isCallerSpeaking ? 'SPEAKING' : 'LISTENING'}</span>
                    </div>
                 </div>
            </div>

            <div className="col-span-2 row-span-6 bg-cad-bg border border-cad-border p-2 flex flex-col space-y-2">
                <h2 className="text-cad-primary font-bold border-b border-cad-border pb-1">DISPATCH UNITS</h2>
                <div className="grid grid-cols-2 gap-2 flex-grow">
                    {[
                        { unit: UnitType.POLICE, icon: <PoliceIcon className="w-8 h-8"/> },
                        { unit: UnitType.FIRE, icon: <FireIcon className="w-8 h-8"/> },
                        { unit: UnitType.EMS_BLS, icon: <EmsIcon className="w-8 h-8"/>, label: "EMS (BLS)" },
                        { unit: UnitType.EMS_ALS, icon: <EmsIcon className="w-8 h-8"/>, label: "EMS (ALS)" },
                        { unit: UnitType.SWAT, icon: <SwatIcon className="w-8 h-8"/> },
                    ].map(({unit, icon, label}) => (
                        <button key={unit} onClick={() => toggleDispatch(unit)} className={`p-2 rounded border-2 transition-colors flex flex-col items-center justify-center ${callData.dispatchedUnits.includes(unit) ? 'bg-cad-primary text-cad-bg border-cad-primary' : 'bg-cad-border border-cad-text-dim hover:bg-cad-text-dim/20'}`}>
                            {icon}
                            <span className="text-xs font-bold mt-1">{label || unit}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="col-span-3 row-span-2 bg-cad-bg border border-cad-border p-2 flex flex-col gap-2">
                <div className="flex-grow-[2]">
                    <Map callerLocation={callerLocation} units={mapUnits} />
                </div>
                <div className="flex gap-2 flex-grow-[1]">
                    <div className="flex flex-col w-1/3">
                        <label htmlFor="address" className="text-cad-primary text-sm font-bold mb-1">LOCATION</label>
                        <input type="text" name="address" value={callData.address} onChange={handleCallDataChange} className="bg-cad-border text-cad-text p-2 rounded h-full" placeholder="Enter address..."/>
                    </div>
                    <div className="flex flex-col w-1/3">
                        <label htmlFor="description" className="text-cad-primary text-sm font-bold mb-1">DESCRIPTION</label>
                        <textarea name="description" value={callData.description} onChange={handleCallDataChange} className="bg-cad-border text-cad-text p-2 rounded h-full resize-none" placeholder="Incident description..."></textarea>
                    </div>
                    <div className="flex flex-col w-1/3">
                         <label htmlFor="notes" className="text-cad-primary text-sm font-bold mb-1">NOTES</label>
                         <textarea name="notes" value={callData.notes} onChange={handleCallDataChange} className="bg-cad-border text-cad-text p-2 rounded h-full resize-none" placeholder="Caller info, weapons..."></textarea>
                    </div>
                </div>
            </div>
            
            {callStatus !== 'ACTIVE' && (
                 <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                    {callStatus === 'INCOMING' && (
                        <>
                            <h2 className="text-3xl text-cad-warn font-display animate-pulse-red">INCOMING CALL</h2>
                            <p className="text-cad-text-dim mb-6">{scenario.title}</p>
                            <button onClick={answerCall} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full flex items-center space-x-2">
                                <PhoneIcon className="w-6 h-6"/>
                                <span>ANSWER CALL</span>
                            </button>
                        </>
                    )}
                </div>
            )}

            {callStatus === 'ACTIVE' && (
                 <div className="absolute bottom-4 right-4 z-10">
                    <button onClick={endCall} className="bg-cad-error hover:bg-red-700 text-white font-bold py-3 px-8 rounded flex items-center space-x-2">
                        <PhoneIcon className="w-6 h-6"/>
                        <span>END CALL</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default CadInterface;