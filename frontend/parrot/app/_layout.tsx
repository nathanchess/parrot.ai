<<<<<<< HEAD
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '../hooks/useColorScheme';

// import { Stack } from "expo-router";
// import { View } from "react-native";
// import { BackgroundRecordingProvider } from '../context/BackgroundRecordingContext';
=======
import { Stack } from "expo-router";
import { View } from "react-native";
>>>>>>> 3f60c5e (stable AWS transcribe + full frontend)

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </View>
  );
}
