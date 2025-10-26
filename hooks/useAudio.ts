import { useState, useCallback, useRef, useEffect } from 'react';

// Helper function to decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Helper function to decode raw PCM data into an AudioBuffer
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
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


export const useAudio = (sampleRate: number) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        // Fix for webkitAudioContext TypeScript error
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
        return () => {
            audioContextRef.current?.close();
        };
    }, [sampleRate]);

    const playAudio = useCallback(async (base64Audio: string) => {
        if (!base64Audio || !audioContextRef.current) return;

        setIsPlaying(true);
        const audioContext = audioContextRef.current;
        
        try {
            await audioContext.resume();
            const decodedBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(decodedBytes, audioContext, sampleRate, 1);
            
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            
            source.onended = () => {
                setIsPlaying(false);
            };
            
            source.start();
        } catch (error) {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
        }
    }, [sampleRate]);

    return { playAudio, isPlaying };
};