import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";

export default function AuthLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: styles.content,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen 
          name="login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="signup"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="onboarding"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    backgroundColor: "#ffffff",
  },
}); 