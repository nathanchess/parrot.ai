export default {
  expo: {
    name: "parrot",
    slug: "parrot",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY
    },
    plugins: [
        [
            'expo-audio',
            {
                microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone',
            },
        ],
    ],
  }
}; 