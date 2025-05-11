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
    try {
      if (isBackgroundRecording) {
        console.log('🎙️ Background recording already active');
        return;
      }

      console.log('🎙️ Starting background recording process...');
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1, // DoNotMix
        interruptionModeAndroid: 1, // DoNotMix
        shouldDuckAndroid: false,
      });

      // Create temporary recording for noise detection
      const { recording: tempRecording } = await Audio.Recording.createAsync({
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

      // Start monitoring for noise
      let noiseStartTime: number | null = null;
      monitoringIntervalRef.current = setInterval(async () => {
        const isNoisy = await checkAudioLevel(tempRecording);
        
        if (isNoisy) {
          if (!noiseStartTime) {
            noiseStartTime = Date.now();
          } else if (Date.now() - noiseStartTime >= MIN_NOISE_DURATION) {
            // Clear monitoring interval
            if (monitoringIntervalRef.current) {
              clearInterval(monitoringIntervalRef.current);
            }
            
            // Stop temporary recording
            await tempRecording.stopAndUnloadAsync();
            
            // Start actual recording
            console.log('🔊 Noise detected, starting recording...');
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
            startMonitoringAudioLevels();
          }
        } else {
          noiseStartTime = null;
        }
      }, 100);

      // Stop monitoring after 10 seconds if no noise detected
      /*


      setTimeout(async () => {
        if (monitoringIntervalRef.current) {
          clearInterval(monitoringIntervalRef.current);
          await tempRecording.stopAndUnloadAsync();
          console.log('⏱️ No significant noise detected, stopping monitoring');
        }
      }, 5000);
      */

    } catch (error) {
      console.error('❌ Failed to start background recording:', error);
      setIsBackgroundRecording(false);
      recording.current = null;
    }
  };

  const stopBackgroundRecording = async () => {
    try {
      if (!recording.current) {
        console.log('🎙️ No active background recording to stop');
        return;
      }

      console.log('🎙️ Stopping background recording...');
      
      // Clear any existing silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // Ensure recording is stopped
      try {
        await recording.current.stopAndUnloadAsync();
      } catch (error) {
        console.error('❌ Error stopping recording:', error);
      }

      const uri = recording.current.getURI();
      recording.current = null;
      setIsBackgroundRecording(false);
      console.log('✅ Background recording stopped');

      if (uri) {
        await sendAudioToBackend(uri);
      }
    } catch (error) {
      console.error('❌ Error stopping background recording:', error);
      setIsBackgroundRecording(false);
      recording.current = null;
    }
  };

  const startMonitoringAudioLevels = () => {
    const checkAudioLevel = async () => {
      if (!recording.current) return;

      try {
        const status = await recording.current.getStatusAsync();
        if (!status.isRecording) return;

        const metering = status.metering;
        if (metering !== undefined) {
          //console.log('🔊 Current noise level:', metering, 'dB');
          if (metering > NOISE_THRESHOLD) {
            // Reset silence timer if noise is detected
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
              console.log('🔊 Noise detected, resetting silence timer');
            }
          } else {
            // Start silence timer if not already started
            if (!silenceTimerRef.current) {
              console.log('🤫 Silence detected, starting silence timer...');
              silenceTimerRef.current = setTimeout(async () => {
                console.log('🤫 Silence duration reached, stopping recording...');
                await stopBackgroundRecording();
                // Ensure timer is cleared after stopping
                silenceTimerRef.current = null;
              }, SILENCE_DURATION);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error checking audio level:', error);
        // If there's an error checking levels, stop recording
        await stopBackgroundRecording();
      }
    };

    // Check audio levels more frequently
    const interval = setInterval(checkAudioLevel, 50);

    // Cleanup interval when component unmounts
    return () => {
      clearInterval(interval);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  };

  const sendAudioToBackend = async (uri: string) => {
    try {
      console.log('📤 Sending audio to backend...');
      const response = await fetch(uri);
      const blob = await response.blob();
      
      if (blob.size === 0) {
        console.warn('⚠️ Audio file is empty');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1];

        try {
          const response = await fetch('http://172.20.10.2:5000/send-transcription-to-s3', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audio: base64Data }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('✅ Audio sent to backend successfully');
        } catch (error) {
          console.error('❌ Error sending audio to backend:', error);
        }
      };
    } catch (error) {
      console.error('❌ Error processing audio:', error);
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