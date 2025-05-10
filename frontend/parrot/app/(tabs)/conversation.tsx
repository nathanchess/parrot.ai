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
import { BlurView } from "expo-blur";
import LottieView from "lottie-react-native";
import { Audio } from 'expo-av';

const { width } = Dimensions.get("window");

// Add backend configuration
const BACKEND_URL = 'http://172.20.10.2:5000'; // This won't work on mobile
// Replace with your computer's actual local IP address, for example:
// const BACKEND_URL = 'http://192.168.1.100:5000';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isParrotSpeaking, setIsParrotSpeaking] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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
        Alert.alert('Permission required', 'Please grant microphone access to use voice input.');
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

  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording process...');
      
      // Configure audio mode
      console.log('📱 Configuring audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      console.log('✅ Audio mode configured successfully');

<<<<<<< HEAD
      // Create and prepare recording
      console.log('🎥 Creating recording instance...');
      const { recording: newRecording } = await Audio.Recording.createAsync({
=======
      // Create a new recording instance
      console.log('🎥 Creating recording instance...');
      const newRecording = new Audio.Recording();
      
      // Prepare the recorder
      console.log('🎥 Preparing recorder...');
      await newRecording.prepareToRecordAsync({
>>>>>>> 3f60c5e (stable AWS transcribe + full frontend)
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
<<<<<<< HEAD
=======

      // Start recording
      console.log('🎥 Starting recording...');
      await newRecording.startAsync();
>>>>>>> 3f60c5e (stable AWS transcribe + full frontend)
      
      setRecording(newRecording);
      setIsRecording(true);
      console.log('✅ Recording started successfully');

<<<<<<< HEAD
      // Wait a short moment for recording to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start monitoring audio levels
      volumeUpdateInterval.current = setInterval(async () => {
        try {
=======
      // Start monitoring audio levels
      volumeUpdateInterval.current = setInterval(async () => {
        try {
          if (!newRecording) {
            console.log('❌ No recording instance available');
            return;
          }
>>>>>>> 3f60c5e (stable AWS transcribe + full frontend)
          const status = await newRecording.getStatusAsync();
          if (status.isRecording && status.metering !== undefined) {
            // Convert metering to a 0-1 scale
            // Typical metering values are between -160 and 0 dB
            const minDb = -60;
            const maxDb = 0;
            // Apply a power curve to make the scaling more dramatic
            const rawVolume = Math.max(0, Math.min(1, 
              (status.metering - minDb) / (maxDb - minDb)
            ));
            // Square the volume to make the effect more pronounced
            const normalizedVolume = Math.pow(rawVolume, 2);
            
            console.log('📊 Current audio level:', normalizedVolume);
            
            // Update parrot scale with spring animation
            // Scale between 0.9 (slightly smaller when quiet) and 1.8 (much larger when loud)
            Animated.spring(parrotScaleAnim, {
              toValue: 0.9 + (normalizedVolume * 0.9),
              useNativeDriver: true,
              damping: 3, // Reduced damping for more bounce
              mass: 0.3,  // Reduced mass for faster response
              stiffness: 150, // Increased stiffness for more immediate response
            }).start();
          }
        } catch (error) {
          console.error('❌ Error getting audio level:', error);
          // Clear the interval if we get an error
          if (volumeUpdateInterval.current) {
            clearInterval(volumeUpdateInterval.current);
          }
        }
      }, 50); // Update more frequently for smoother animation

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
      console.error('❌ Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      console.error('❌ No active recording to stop');
      return;
    }

    try {
      console.log('🎙️ Stopping recording...');
      const currentRecording = recording;
      setRecording(null); // Clear recording state immediately
      setIsRecording(false); // Update recording state
      
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      console.log('✅ Recording stopped, URI:', uri);
      
      if (!uri) {
        console.error('❌ No recording URI available');
        return;
      }

      // Read the audio file
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('✅ Audio file read, size:', blob.size, 'bytes');

      if (blob.size === 0) {
        console.error('❌ Audio file is empty');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1];
        console.log('✅ Audio converted to base64, length:', base64Data.length);
        setRecordedAudio(base64Data);

        // Send to backend
        setIsProcessing(true);
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
            // Add the transcription as a user message
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
            
            // Trigger LLM response
            console.log('🦜 Triggering parrot response...');
            simulateParrotResponse();
          } else {
            console.error('❌ No transcription in backend response');
          }
        } catch (error) {
          console.error('❌ Error sending audio to backend:', error);
          Alert.alert('Error', 'Failed to process audio. Please try again.');
        } finally {
          setIsProcessing(false);
          console.log('✅ Processing complete');
        }
      };
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const toggleRecording = async () => {
    console.log('🔄 Toggling recording state...');
    if (isRecording) {
      console.log('📥 Stopping recording...');
      await stopRecording();
    } else {
      console.log('📤 Starting recording...');
      await startRecording();
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
      simulateParrotResponse();
    }
  };

  const simulateParrotResponse = () => {
    console.log('🦜 Starting parrot response simulation...');
    setIsParrotSpeaking(true);
    parrotAnimationRef.current?.play();
    
    setTimeout(() => {
      console.log('📝 Adding parrot response message...');
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm analyzing your conversation and will provide insights based on your recorded interactions.",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
      setInputText("");
      console.log('✅ Parrot response added to messages');
      
      // Stop animations and reset state after response
      setTimeout(() => {
        console.log('🦜 Stopping parrot animations...');
        setIsParrotSpeaking(false);
        parrotAnimationRef.current?.pause();
        parrotScaleAnim.setValue(1);
        parrotBounceAnim.setValue(0);
      }, 1000); // Wait 1 second after response to stop animations
    }, 2000);
  };

  const handleTypingComplete = () => {
    console.log('🦜 Typing complete, stopping animations...');
    setIsParrotSpeaking(false);
    parrotAnimationRef.current?.pause();
    parrotScaleAnim.setValue(1);
    parrotBounceAnim.setValue(0);
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