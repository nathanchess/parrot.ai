import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useBackgroundRecording } from '../context/BackgroundRecordingContext';
import Constants from 'expo-constants';

const ELEVENLABS_API_KEY = Constants.expoConfig?.extra?.ELEVENLABS_API_KEY;

type Message = {
  id: string;
  text: string;
  timestamp: Date;
  sender: 'user' | 'assistant';
};

const TypewriterText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeNextChar, 30);
      } else {
        setIsComplete(true);
        if (onComplete) {
          onComplete();
        }
      }
    };

    timeoutId = setTimeout(typeNextChar, 30);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return <Text style={styles.messageText}>{displayedText}</Text>;
};

export default function Conversation() {
  const { stopBackgroundRecording, startBackgroundRecording, isBackgroundRecording } = useBackgroundRecording();
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParrotSpeaking, setIsParrotSpeaking] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const parrotAnimationRef = useRef<LottieView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const parrotScaleAnim = useRef(new Animated.Value(1)).current;
  const parrotBounceAnim = useRef(new Animated.Value(0)).current;
  const volumeUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Request audio permissions
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Microphone permission not granted');
      }
    })();
  }, []);

  useEffect(() => {
    // Start idle animation
    parrotAnimationRef.current?.play();
  }, []);

  useEffect(() => {
    if (isParrotSpeaking) {
      // Create a more dynamic speaking animation
      Animated.parallel([
        // Scale animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(parrotScaleAnim, {
              toValue: 1.1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(parrotScaleAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        ),
        // Bounce animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(parrotBounceAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(parrotBounceAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      parrotScaleAnim.setValue(1);
      parrotBounceAnim.setValue(0);
    }
  }, [isParrotSpeaking]);

  useEffect(() => {
    if (isRecording) {
      // Create a staggered dot animation
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(dotAnim1, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim2, {
              toValue: 1,
              duration: 400,
              delay: 200,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim3, {
              toValue: 1,
              duration: 400,
              delay: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(dotAnim1, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim2, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim3, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      // Reset animations when recording stops
      dotAnim1.setValue(0);
      dotAnim2.setValue(0);
      dotAnim3.setValue(0);
    }
  }, [isRecording]);

  const toggleRecording = async () => {
    if (isProcessing) return; // Don't allow toggling while processing
    
    if (isRecording) {
      setIsProcessing(true); // Set processing state before stopping
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording process...');
      
      // Stop background recording first
      if (isBackgroundRecording) {
        console.log('🛑 Stopping background recording...');
        await stopBackgroundRecording();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Ensure any existing recording is unloaded
      if (recording) {
        console.log('🛑 Unloading existing recording...');
        try {
          await recording.stopAndUnloadAsync();
        } catch (e) {
          console.log('Error unloading recording:', e);
        }
        setRecording(null);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Configure audio mode
      console.log('📱 Configuring audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
        shouldDuckAndroid: false,
      });
      console.log('✅ Audio mode configured successfully');

      // Create and prepare recording
      console.log('🎥 Creating recording instance...');
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
      
      setRecording(newRecording);
      setIsRecording(true);
      console.log('✅ Recording started successfully');

      // Wait a short moment for recording to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start monitoring audio levels
      let isMonitoring = true;
      volumeUpdateInterval.current = setInterval(async () => {
        if (!isMonitoring || !newRecording) {
          if (volumeUpdateInterval.current) {
            clearInterval(volumeUpdateInterval.current);
          }
          return;
        }

        try {
          const status = await newRecording.getStatusAsync();
          if (!status.isRecording) {
            isMonitoring = false;
            if (volumeUpdateInterval.current) {
              clearInterval(volumeUpdateInterval.current);
            }
            return;
          }

          // Get the metering value directly from the status
          const metering = status.metering;
          if (metering !== undefined) {
            // Convert metering to a 0-1 scale
            const minDb = -60;
            const maxDb = 0;
            const rawVolume = Math.max(0, Math.min(1, 
              (metering - minDb) / (maxDb - minDb)
            ));
            const normalizedVolume = Math.pow(rawVolume, 2);
            
            // Update parrot scale with spring animation
            Animated.spring(parrotScaleAnim, {
              toValue: 0.9 + (normalizedVolume * 0.9),
              useNativeDriver: true,
              damping: 3,
              mass: 0.3,
              stiffness: 150,
            }).start();
          }
        } catch (error) {
          // Silently handle the error since the functionality is working
          isMonitoring = false;
          if (volumeUpdateInterval.current) {
            clearInterval(volumeUpdateInterval.current);
          }
        }
      }, 50);

      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
      console.log('🎬 Recording is now active - waiting for user input...');

      Alert.alert('Recording', 'Recording started. Tap the microphone again to stop.');
    } catch (err) {
      console.log('Failed to start recording:', err);
      setIsRecording(false);
      setRecording(null);
      if (volumeUpdateInterval.current) {
        clearInterval(volumeUpdateInterval.current);
        volumeUpdateInterval.current = null;
      }
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      console.log('No active recording to stop');
      setIsProcessing(false);
      return;
    }

    try {
      console.log('🎙️ Stopping recording...');
      const currentRecording = recording;
      setRecording(null);
      setIsRecording(false);
      
      if (volumeUpdateInterval.current) {
        clearInterval(volumeUpdateInterval.current);
        volumeUpdateInterval.current = null;
      }
      
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      console.log('✅ Recording stopped, URI:', uri);
      
      console.log('🔄 Starting background recording...');
      await startBackgroundRecording();
      
      if (!uri) {
        console.log('No recording URI available');
        setIsProcessing(false);
        return;
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('✅ Audio file read, size:', blob.size, 'bytes');

      if (blob.size === 0) {
        console.log('Audio file is empty');
        setIsProcessing(false);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1];
        console.log('✅ Audio converted to base64, length:', base64Data.length);
        setRecordedAudio(base64Data);

        try {
          console.log('📤 Sending audio to backend...');
          const response = await fetch('http://172.20.10.2:5000/ingest-microphone-prompt-audio', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audio: base64Data }),
          });

          const data = await response.json();
          console.log('✅ Backend response:', data);

          if (data.transcription) {
            console.log('📝 Received transcription:', data.transcription);
            const newMessage: Message = {
              id: Date.now().toString(),
              text: data.transcription,
              sender: 'user',
              timestamp: new Date(),
            };
            console.log('📤 Adding transcription as user message...');
            setMessages(prev => [...prev, newMessage]);
            setInputText(data.transcription);
            console.log('✅ Transcription added to chat');
            
            console.log('🦜 Triggering parrot response...');
            await simulateParrotResponse(data.transcription);
          } else {
            console.log('No transcription in backend response');
          }
        } catch (error) {
          console.log('Error sending audio to backend:', error);
        } finally {
          setIsProcessing(false);
          console.log('✅ Processing complete');
        }
      };
    } catch (error) {
      console.log('Error stopping recording:', error);
      setIsProcessing(false);
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      console.log('📤 Sending typed message...');
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputText("");
      console.log('✅ Message sent, triggering parrot response...');
      simulateParrotResponse(inputText);
    }
  };

  const handleTypingComplete = () => {
    console.log('🦜 Typing complete, stopping animations...');
    setIsParrotSpeaking(false);
    parrotAnimationRef.current?.pause();
    parrotScaleAnim.setValue(1);
    parrotBounceAnim.setValue(0);
  };

  const simulateParrotResponse = async (prompt: string) => {
    console.log('🦜 Starting parrot response simulation...');
    setIsParrotSpeaking(true);
    parrotAnimationRef.current?.play();
    
    try {
      /*


      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: prompt }),
      });
      */

      //const data = await response.json();
      const message = "Hi my name is Parrot.AI";

      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: message,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, responseMessage]);

      // Convert text to speech using ElevenLabs API
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': ELEVENLABS_API_KEY || '',
            },
            body: JSON.stringify({
              text: message,
              model_id: "eleven_monolingual_v1",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
              }
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to generate speech');
        }

        // Get the audio data as a blob
        const audioBlob = await response.blob();
        
        // Create a temporary file path
        const fileUri = FileSystem.documentDirectory + 'temp_audio.mp3';
        
        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result?.toString().split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(audioBlob);
        const base64Data = await base64Promise;

        // Write the audio data to the file
        await FileSystem.writeAsStringAsync(fileUri, base64Data as string, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log('🔊 Audio file written to:', fileUri);

        // Configure audio mode for playback
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false,
          interruptionModeIOS: 1,
          interruptionModeAndroid: 1,
        });

        // Create and play the sound
        const { sound } = await Audio.Sound.createAsync(
          { uri: fileUri },
          { 
            shouldPlay: true,
            volume: 1.0,
            isMuted: false,
            isLooping: false,
            progressUpdateIntervalMillis: 100,
          }
        );

        console.log('🎵 Starting audio playback...');

        // Play the audio
        try {
          // Ensure volume is at maximum
          await sound.setVolumeAsync(1.0);
          await sound.setIsMutedAsync(false);
          
          // Start playback
          await sound.playAsync();
          console.log('✅ Audio playback started');

          // Double-check volume after a short delay
          setTimeout(async () => {
            const status = await sound.getStatusAsync();
            console.log('Playback status check:', status);
            if (status.isLoaded) {
              await sound.setVolumeAsync(1.0);
            }
          }, 100);

        } catch (error) {
          console.error('Error playing audio:', error);
          setIsParrotSpeaking(false);
          parrotAnimationRef.current?.pause();
          return;
        }

        // Clean up when done
        sound.setOnPlaybackStatusUpdate(async (status) => {
          console.log('Playback status:', status);
          if (status.isLoaded && status.didJustFinish) {
            console.log('🎵 Audio playback finished');
            await sound.unloadAsync();
            await FileSystem.deleteAsync(fileUri);
            setIsParrotSpeaking(false);
            parrotAnimationRef.current?.pause();
          }
        });
      } catch (error) {
        console.error('Error with text-to-speech:', error);
        setIsParrotSpeaking(false);
        parrotAnimationRef.current?.pause();
      }

    } catch (error) {
      console.log('Error getting response:', error);
      setIsParrotSpeaking(false);
      parrotAnimationRef.current?.pause();
    }
  };

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (volumeUpdateInterval.current) {
        clearInterval(volumeUpdateInterval.current);
      }
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Parrot.AI</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.parrotContainer}>
          <View style={styles.parrotBackground}>
            <Pressable 
              style={styles.parrotFrame}
              onPress={toggleRecording}
              android_ripple={{ color: 'rgba(76, 175, 80, 0.1)' }}
            >
              <Animated.View
                style={[
                  styles.parrotWrapper,
                  {
                    transform: [
                      { scale: parrotScaleAnim },
                      {
                        translateY: parrotBounceAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -10],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LottieView
                  ref={parrotAnimationRef}
                  source={require("../../assets/animations/parrot.json")}
                  style={styles.parrotAnimation}
                  loop={isParrotSpeaking}
                  autoPlay={false}
                  speed={isParrotSpeaking ? 2 : 1}
                />
              </Animated.View>
            </Pressable>
            <View style={styles.parrotInfo}>
              <Text style={styles.parrotName}>Your Parrot Is Ready</Text>
              {isRecording ? (
                <View style={styles.listeningContainer}>
                  <Text style={styles.listeningText}>Listening</Text>
                  <View style={styles.dotsContainer}>
                    <Animated.View
                      style={[
                        styles.dot,
                        {
                          opacity: dotAnim1,
                          transform: [
                            {
                              translateY: dotAnim1.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -4],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.dot,
                        {
                          opacity: dotAnim2,
                          transform: [
                            {
                              translateY: dotAnim2.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -4],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.dot,
                        {
                          opacity: dotAnim3,
                          transform: [
                            {
                              translateY: dotAnim3.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -4],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : isProcessing ? (
                <Text style={styles.parrotStatus}>Processing audio...</Text>
              ) : (
                <Text style={styles.parrotStatus}>Tap to start recording</Text>
              )}
            </View>
          </View>
          {isParrotSpeaking && (
            <View style={styles.captionContainer}>
              <Text style={styles.captionText}>
                Analyzing your conversation...
              </Text>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Pressable
            style={[
              styles.voiceButton,
              isRecording && styles.voiceButtonActive,
            ]}
            onPress={toggleRecording}
          >
            <Animated.View
              style={[
                styles.voiceButtonInner,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons
                name={isRecording ? "mic" : "mic-outline"}
                size={24}
                color={isRecording ? "#ffffff" : "#4CAF50"}
              />
            </Animated.View>
          </Pressable>

          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your conversations..."
            placeholderTextColor="#666666"
            multiline
          />

          <Pressable
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={24}
              color={inputText.trim() ? "#ffffff" : "#666666"}
            />
          </Pressable>
        </View>
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.processingText}>Processing audio...</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: "#4CAF50",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: "#f5f5f5",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 4,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    color: "#666666",
    alignSelf: "flex-end",
  },
  parrotContainer: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
    paddingVertical: 12,
    position: 'relative',
  },
  parrotBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  parrotFrame: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  parrotWrapper: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  parrotInfo: {
    marginLeft: 16,
    flex: 1,
  },
  parrotName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  parrotStatus: {
    fontSize: 14,
    color: '#666666',
  },
  parrotAnimation: {
    width: "100%",
    height: "100%",
  },
  listeningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listeningText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
    marginHorizontal: 2,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  captionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#ffffff",
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  voiceButtonActive: {
    backgroundColor: "#4CAF50",
  },
  voiceButtonInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: "#f5f5f5",
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
}); 