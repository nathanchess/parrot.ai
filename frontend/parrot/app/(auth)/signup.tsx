import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import GradientText from "../components/GradientText";
import { useGoogleAuth, useAppleAuth } from "../services/auth";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signInWithGoogle } = useGoogleAuth();
  const { signInWithApple } = useAppleAuth();

  const handleSignUp = () => {
    // TODO: Implement sign up logic
    console.log("Sign up with:", { email, password, confirmPassword });
    router.replace("/(auth)/onboarding");
  };

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithGoogle();
      if (result) {
        // Handle successful Google sign-in
        console.log("Google sign-in successful");
        router.replace("/(auth)/onboarding");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to sign in with Google");
    }
  };

  const handleAppleSignUp = async () => {
    try {
      const result = await signInWithApple();
      if (result) {
        // Handle successful Apple sign-in
        console.log("Apple sign-in successful");
        router.replace("/(auth)/onboarding");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to sign in with Apple");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#666666" />
        </TouchableOpacity>

        <View style={styles.header}>
          <GradientText text="Create Account" style={styles.title} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <Pressable style={styles.primaryButton} onPress={handleSignUp}>
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <Pressable
              style={styles.socialButton}
              onPress={handleGoogleSignUp}
            >
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
              </View>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </Pressable>

            <Pressable
              style={styles.socialButton}
              onPress={handleAppleSignUp}
            >
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-apple" size={20} color="#000000" />
              </View>
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Log in</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 120,
  },
  backButton: {
    position: 'absolute',
    top: 120,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    marginBottom: 30,
    width: "100%",
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  primaryButton: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666666",
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: "column",
    gap: 12,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#ffffff",
  },
  socialIconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 10,
  },
  footerText: {
    color: "#666666",
    fontSize: 16,
  },
  footerLink: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "600",
  },
}); 