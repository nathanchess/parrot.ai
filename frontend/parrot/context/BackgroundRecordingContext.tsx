import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

// Background recording configuration
const BACKEND_URL = 'http://172.20.10.2:5000';
const NOISE_THRESHOLD = -30; // dB threshold for speech detection
const SILENCE_DURATION = 5000; // ms of silence before considering speech ended
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 5000; // 5 seconds

const BACKGROUND_RECORDING_OPTIONS = {
  ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
  android: {
    ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
    meteringEnabled: true,
  } as Audio.RecordingOptionsAndroid,
  ios: {
    ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
    meteringEnabled: true,
  } as Audio.RecordingOptionsIOS,
};

type BackgroundRecordingContextType = {
  startBackgroundRecording: () => Promise<void>;
  stopBackgroundRecording: () => Promise<void>;
  isBackgroundRecording: boolean;
};

const BackgroundRecordingContext = createContext<BackgroundRecordingContextType | undefined>(undefined);

export const BackgroundRecordingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);
  const segmentStartTimeRef = useRef<number | null>(null);

  const sendAudioSegment = async (audioData: string, retryCount = 0): Promise<void> => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      console.log('📤 Sending audio segment to KVS...');
      const response = await fetch(`${BACKEND_URL}/stream-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: audioData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Audio segment streamed to KVS successfully:', result);
    } catch (error) {
      console.error('❌ Error streaming audio segment to KVS:', error);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return sendAudioSegment(audioData, retryCount + 1);
      }
      
      throw error;
    }
  };

  const handleAudioLevel = async (status: Audio.RecordingStatus) => {
    if (status.metering === undefined) return;
    
    const currentLevel = status.metering;

    // Check if we're currently in a speaking segment
    if (isSpeakingRef.current) {
      // If we're speaking and the level drops below threshold
      if (currentLevel < NOISE_THRESHOLD) {
        if (!silenceTimerRef.current) {
          console.log('⏱️ Starting silence timer...');
          silenceTimerRef.current = setTimeout(async () => {
            console.log('⏱️ Silence timer callback executing...');
            console.log('🔍 Checking recording state:', {
              hasRecording: !!recordingRef.current,
              segmentStartTime: segmentStartTimeRef.current,
              isSpeaking: isSpeakingRef.current
            });
            
            if (!recordingRef.current) {
              console.log('❌ No recording instance available');
              return;
            }
            
            if (!segmentStartTimeRef.current) {
              console.log('❌ No segment start time available');
              return;
            }

            const segmentDuration = Date.now() - segmentStartTimeRef.current;
            console.log('⏱️ Segment duration:', segmentDuration, 'ms');
            console.log('📤 Preparing to send audio segment to backend');
            isSpeakingRef.current = false;
            
            try {
              const uri = recordingRef.current.getURI();
              if (!uri) {
                console.error('❌ No recording URI available');
                return;
              }

              console.log('📥 Reading audio file from URI:', uri);
              const response = await fetch(uri);
              const blob = await response.blob();
              console.log('📦 Audio blob size:', blob.size, 'bytes');
              
              const reader = new FileReader();
              reader.onload = async () => {
                const base64data = reader.result as string;
                const audioData = base64data.split(',')[1]; // Remove data URL prefix
                console.log('📤 Sending audio segment to backend...');
                await sendAudioSegment(audioData);
                console.log('✅ Audio segment sent successfully');
              };

              reader.readAsDataURL(blob);
            } catch (error) {
              console.error('❌ Error processing audio segment:', error);
              setError(error instanceof Error ? error.message : 'Unknown error occurred');
            }
          }, SILENCE_DURATION);
          console.log('⏱️ Silence timer started, will execute in', SILENCE_DURATION, 'ms');
        }
      } else {
        // If we're speaking and the level is still above threshold, reset the silence timer
        if (silenceTimerRef.current) {
          console.log('⏱️ Clearing silence timer - audio level above threshold');
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }
    } else {
      // If we're not speaking and the level goes above threshold
      if (currentLevel > NOISE_THRESHOLD) {
        console.log('🗣️ Speech detected, starting new segment');
        console.log('⏱️ Segment start time:', new Date().toISOString());
        isSpeakingRef.current = true;
        segmentStartTimeRef.current = Date.now();
        
        // Clear any existing silence timer
        if (silenceTimerRef.current) {
          console.log('⏱️ Clearing existing silence timer - new speech detected');
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }
    }
  };

  const startBackgroundRecording = async () => {
    try {
      console.log('🎤 Starting background recording...');
      
      // Clean up any existing recording first
      if (recordingRef.current) {
        console.log('🧹 Cleaning up existing recording...');
        try {
          await recordingRef.current.stopAndUnloadAsync();
          console.log('✅ Existing recording cleaned up');
        } catch (error) {
          console.warn('⚠️ Error cleaning up existing recording:', error);
        }
        recordingRef.current = null;
        setRecording(null);
      }

      console.log('🔍 Requesting microphone permissions...');
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Microphone permission denied');
        throw new Error('Permission to access microphone was denied');
      }
      console.log('✅ Microphone permission granted');

      // Configure audio mode
      console.log('⚙️ Configuring audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1, // DoNotMix
        interruptionModeAndroid: 1, // DoNotMix
        shouldDuckAndroid: true,
      });
      console.log('✅ Audio mode configured');

      // Create and start recording
      console.log('🎥 Creating recording instance...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        BACKGROUND_RECORDING_OPTIONS,
        handleAudioLevel,
        100 // Update interval in milliseconds
      );
      console.log('✅ Recording instance created');

      recordingRef.current = newRecording;
      setRecording(newRecording);
      setIsRecording(true);
      setError(null);
      isSpeakingRef.current = false;
      segmentStartTimeRef.current = null;
      
      console.log('🎉 Background recording started successfully');
      console.log('👂 Listening for audio input...');
    } catch (error) {
      console.error('❌ Error starting background recording:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      throw error;
    }
  };

  const stopBackgroundRecording = async () => {
    try {
      console.log('🛑 Stopping background recording...');
      
      if (silenceTimerRef.current) {
        console.log('⏱️ Clearing silence timer');
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      if (recording) {
        console.log('⏹️ Stopping recording instance');
        await recording.stopAndUnloadAsync();
        setRecording(null);
        console.log('✅ Recording instance stopped');
      }
      
      setIsRecording(false);
      isSpeakingRef.current = false;
      segmentStartTimeRef.current = null;
      
      if (abortControllerRef.current) {
        console.log('🛑 Aborting any pending requests');
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      console.log('✅ Background recording stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping background recording:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      throw error;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBackgroundRecording();
    };
  }, []);

  return (
    <BackgroundRecordingContext.Provider
      value={{
        startBackgroundRecording,
        stopBackgroundRecording,
        isBackgroundRecording: isRecording,
      }}
    >
      {children}
    </BackgroundRecordingContext.Provider>
  );
};

export const useBackgroundRecording = () => {
  const context = useContext(BackgroundRecordingContext);
  if (context === undefined) {
    throw new Error('useBackgroundRecording must be used within a BackgroundRecordingProvider');
  }
  return context;
}; 