import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

interface BackgroundRecordingContextType {
  isBackgroundRecording: boolean;
  startBackgroundRecording: () => Promise<void>;
  stopBackgroundRecording: () => Promise<void>;
}

const BackgroundRecordingContext = createContext<BackgroundRecordingContextType | undefined>(undefined);

export function BackgroundRecordingProvider({ children }: { children: React.ReactNode }) {
  const [isBackgroundRecording, setIsBackgroundRecording] = useState(false);
  const recording = useRef<Audio.Recording | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const NOISE_THRESHOLD = -35; // dB - Adjusted to be more sensitive to minimal noise
  const SILENCE_DURATION = 1000; // ms - Reduced to stop faster
  const MIN_NOISE_DURATION = 0; // ms - Minimum time of noise before starting recording

  const checkAudioLevel = async (tempRecording: Audio.Recording) => {
    try {
      const status = await tempRecording.getStatusAsync();
      if (!status.isRecording) return false;

      const metering = status.metering;
      if (metering !== undefined) {
        console.log('🔊 Current noise level:', metering, 'dB');
        return metering > NOISE_THRESHOLD;
      }
      return false;
    } catch (error) {
      console.error('❌ Error checking audio level:', error);
      return false;
    }
  };

  const startBackgroundRecording = async () => {
    if (isBackgroundRecording) {
      console.log('🎙️ Background recording already in progress');
      return;
    }

    try {
      console.log('🎙️ Starting background recording process...');
      
      // Configure audio mode for background recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
        shouldDuckAndroid: false,
      });

      // Create and prepare recording
      const { recording: newRecording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          meteringEnabled: true,
        } as Audio.RecordingOptionsAndroid,
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          meteringEnabled: true,
        } as Audio.RecordingOptionsIOS,
      });

      recording.current = newRecording;
      setIsBackgroundRecording(true);
      console.log('✅ Background recording started');

      // Start monitoring audio levels
      let silenceStartTime: number | null = null;
      let isMonitoring = true;

      const monitorInterval = setInterval(async () => {
        if (!isMonitoring || !newRecording) {
          clearInterval(monitorInterval);
          return;
        }

        try {
          const status = await newRecording.getStatusAsync();
          if (!status.isRecording) {
            isMonitoring = false;
            clearInterval(monitorInterval);
            return;
          }

          const metering = status.metering;
          if (metering !== undefined) {
            console.log('🔊 Current noise level:', metering, 'dB');
            
            if (metering > NOISE_THRESHOLD) {
              if (silenceStartTime) {
                console.log('🔊 Noise detected, resetting silence timer');
                silenceStartTime = null;
              }
            } else {
              if (!silenceStartTime) {
                console.log('🤫 Silence detected, starting silence timer...');
                silenceStartTime = Date.now();
              } else if (Date.now() - silenceStartTime >= SILENCE_DURATION) {
                console.log('🤫 Silence duration reached, stopping recording...');
                isMonitoring = false;
                clearInterval(monitorInterval);
                await stopBackgroundRecording();
                
                // Immediately restart monitoring after stopping
                console.log('🔄 Restarting background monitoring...');
                startBackgroundRecording();
              }
            }
          }
        } catch (error) {
          console.error('❌ Error checking audio levels:', error);
          isMonitoring = false;
          clearInterval(monitorInterval);
        }
      }, 100);

      // Store the interval ID for cleanup
      monitoringIntervalRef.current = monitorInterval;
    } catch (error) {
      console.error('❌ Error starting background recording:', error);
      setIsBackgroundRecording(false);
      recording.current = null;
    }
  };

  const stopBackgroundRecording = async () => {
    if (!recording.current) {
      console.log('🎙️ No active background recording to stop');
      return;
    }

    try {
      console.log('🎙️ Stopping background recording...');
      const currentRecording = recording.current;
      recording.current = null;
      setIsBackgroundRecording(false);

      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }

      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      console.log('✅ Background recording stopped');

      if (uri) {
        // Read the audio file
        const response = await fetch(uri);
        const blob = await response.blob();
        
        if (blob.size > 0) {
          // Convert to base64
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const base64Data = base64Audio.split(',')[1];
            
            // Send to backend
            try {
              console.log('📤 Sending audio to backend...');
              const response = await fetch('http://172.20.10.2:5000/send-transcription-to-s3', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ audio: base64Data }),
              });
              
              if (response.ok) {
                console.log('✅ Audio sent to backend successfully');
              } else {
                console.error('❌ Failed to send audio to backend');
              }
            } catch (error) {
              console.error('❌ Error sending audio to backend:', error);
            }
          };
        }
      }
    } catch (error) {
      console.error('❌ Error stopping background recording:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recording.current) {
        recording.current.stopAndUnloadAsync();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, []);

  return (
    <BackgroundRecordingContext.Provider
      value={{
        isBackgroundRecording,
        startBackgroundRecording,
        stopBackgroundRecording,
      }}
    >
      {children}
    </BackgroundRecordingContext.Provider>
  );
}

export function useBackgroundRecording() {
  const context = useContext(BackgroundRecordingContext);
  if (context === undefined) {
    throw new Error('useBackgroundRecording must be used within a BackgroundRecordingProvider');
  }
  return context;
} 