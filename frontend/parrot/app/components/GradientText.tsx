import { Text, StyleSheet } from "react-native";

interface GradientTextProps {
  text: string;
  style?: any;
}

export default function GradientText({ text, style }: GradientTextProps) {
  return (
    <Text style={[styles.text, style]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 32,
    fontWeight: "700",
    color: "#4CAF50",
    textAlign: "center",
  },
}); 