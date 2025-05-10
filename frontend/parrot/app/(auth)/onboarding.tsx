import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
} from "react-native";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import GradientText from "../components/GradientText";

const { width } = Dimensions.get("window");

type Question = {
  id: number;
  question: string;
  options: string[];
};

const questions: Question[] = [
  {
    id: 1,
    question: "What is your primary use case for Parrot.AI?",
    options: [
      "Personal Conversations & Meetings",
      "Academic Lectures & Classes",
      "Professional Meetings & Interviews",
      "Personal Notes & Reminders",
    ],
  },
  {
    id: 2,
    question: "What would you classify yourself as?",
    options: [
      "Student",
      "Professional",
      "Researcher",
      "Entrepreneur",
      "Other",
    ],
  },
  {
    id: 3,
    question: "What type of content do you want to track the most?",
    options: [
      "Meeting Notes & Action Items",
      "Lecture Content & Study Notes",
      "Personal Conversations & Memories",
      "Ideas & Brainstorming Sessions",
    ],
  },
  {
    id: 4,
    question: "How often do you need to recall past conversations?",
    options: [
      "Multiple times daily",
      "Once or twice a day",
      "A few times a week",
      "Occasionally",
    ],
  },
  {
    id: 5,
    question: "What's your preferred way to access your recorded content?",
    options: [
      "Search by keywords",
      "Browse by date",
      "View by categories",
      "Get AI-generated summaries",
    ],
  },
  {
    id: 6,
    question: "How important is privacy for your recorded content?",
    options: [
      "Extremely important",
      "Very important",
      "Somewhat important",
      "Not a major concern",
    ],
  },
  {
    id: 7,
    question: "What features would be most valuable to you?",
    options: [
      "Real-time transcription",
      "AI-powered summaries",
      "Smart search & retrieval",
      "Voice commands & shortcuts",
    ],
  },
  {
    id: 8,
    question: "How do you plan to use Parrot.AI's background recording?",
    options: [
      "During work meetings",
      "In academic settings",
      "For personal conversations",
      "For creative brainstorming",
    ],
  },
];

type FeatureModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
};

const FeatureModal = ({ visible, onClose, title, description, icon, benefits }: FeatureModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons name={icon as any} size={32} color="#4CAF50" />
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          
          <Text style={styles.modalDescription}>{description}</Text>
          
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Key Benefits:</Text>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Got it</Text>
          </Pressable>
        </View>
      </BlurView>
    </Modal>
  );
};

const CompletionScreen = ({ onContinue }: { onContinue: () => void }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const features = {
    recording: {
      title: "Non-disruptive Recording",
      description: "Parrot.AI works silently in the background, capturing your conversations and important moments without interrupting your flow.",
      icon: "mic",
      benefits: [
        "Zero interference with your daily activities",
        "Automatic voice detection and recording",
        "Battery-efficient background operation",
        "Smart pause during silence periods"
      ]
    },
    knowledge: {
      title: "Chat with Your Knowledge Base",
      description: "Interact with your recorded conversations and memories through an intuitive chat interface, powered by advanced AI.",
      icon: "chatbubble-ellipses",
      benefits: [
        "Natural language conversation with your data",
        "Instant access to past conversations",
        "Smart context understanding",
        "Personalized insights and summaries"
      ]
    },
    privacy: {
      title: "Privacy-Focused",
      description: "Your data security is our top priority. All recordings are processed locally and encrypted with enterprise-grade security.",
      icon: "shield-checkmark",
      benefits: [
        "End-to-end encryption",
        "Local data processing",
        "No third-party data sharing",
        "Complete control over your data"
      ]
    }
  };

  useEffect(() => {
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
  }, []);

  return (
    <View style={styles.completionContainer}>
      <Animated.View
        style={[
          styles.recordingIndicator,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.recordingDot} />
      </Animated.View>
      
      <GradientText
        text="Your Knowledge Base is Ready"
        style={styles.completionTitle}
      />
      
      <Text style={styles.completionDescription}>
        Parrot.AI is now recording in the background, building your personal knowledge base from conversations and important moments.
      </Text>

      <View style={styles.completionFeatures}>
        <Pressable 
          style={styles.featureItem}
          onPress={() => setActiveModal('recording')}
        >
          <Ionicons name="mic" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>Non-disruptive recording</Text>
          <Ionicons name="information-circle-outline" size={20} color="#666666" />
        </Pressable>
        
        <Pressable 
          style={styles.featureItem}
          onPress={() => setActiveModal('knowledge')}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>Chat with your knowledge base</Text>
          <Ionicons name="information-circle-outline" size={20} color="#666666" />
        </Pressable>
        
        <Pressable 
          style={styles.featureItem}
          onPress={() => setActiveModal('privacy')}
        >
          <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>Privacy-focused</Text>
          <Ionicons name="information-circle-outline" size={20} color="#666666" />
        </Pressable>
      </View>

      <Pressable
        style={styles.conversationButton}
        onPress={onContinue}
      >
        <Ionicons name="chatbubble" size={24} color="#ffffff" style={styles.buttonIcon} />
        <Text style={styles.conversationButtonText}>Start Conversation</Text>
      </Pressable>

      {Object.entries(features).map(([key, feature]) => (
        <FeatureModal
          key={key}
          visible={activeModal === key}
          onClose={() => setActiveModal(null)}
          {...feature}
        />
      ))}
    </View>
  );
};

export default function Onboarding() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showCompletion, setShowCompletion] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate progress bar when question changes
    Animated.timing(progressAnim, {
      toValue: ((currentQuestion + 1) / questions.length) * 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentQuestion]);

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestion].id]: answer,
    }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setShowCompletion(true);
    }
  };

  const handleComplete = () => {
    console.log("User preferences:", answers);
    router.replace("/(tabs)/conversation");
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const animatePress = (isPressed: boolean) => {
    Animated.spring(scaleAnim, {
      toValue: isPressed ? 0.95 : 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  if (showCompletion) {
    return <CompletionScreen onContinue={handleComplete} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} 
          />
        </View>
      </View>

      <View style={styles.content}>
        <GradientText
          text={`Question ${currentQuestion + 1} of ${questions.length}`}
          style={styles.questionNumber}
        />
        <Text style={styles.question}>
          {questions[currentQuestion].question}
        </Text>

        <View style={styles.optionsContainer}>
          {questions[currentQuestion].options.map((option, index) => (
            <Pressable
              key={index}
              style={styles.option}
              onPress={() => handleAnswer(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          ))}
        </View>

        {currentQuestion > 0 && (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              style={styles.backButton}
              onPress={handleBack}
              onPressIn={() => animatePress(true)}
              onPressOut={() => animatePress(false)}
            >
              <Ionicons name="chevron-back" size={20} color="#666666" />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  progressContainer: {
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    marginTop: 20,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: 40,
  },
  questionNumber: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  question: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 40,
    textAlign: "center",
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  option: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  optionText: {
    fontSize: 16,
    color: "#1a1a1a",
    textAlign: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignSelf: "center",
    minWidth: 120,
  },
  backButtonText: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  completionContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  recordingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  completionDescription: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  completionFeatures: {
    width: "100%",
    gap: 20,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    justifyContent: "space-between",
  },
  featureText: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  conversationButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  conversationButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  modalDescription: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
    marginBottom: 20,
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: "#666666",
    flex: 1,
  },
  closeButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
}); 