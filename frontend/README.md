# Parrot.AI Frontend

A React Native mobile application for real-time conversation analysis and transcription.

## Features

- Real-time audio recording and transcription
- Background audio monitoring
- Interactive parrot animation with audio level visualization
- Dark/Light theme support
- Real-time conversation analysis
- Voice input and text input support

## Tech Stack

- React Native
- Expo
- TypeScript
- React Navigation
- Expo AV (Audio/Video)
- Lottie for animations

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

## Setup

1. Install dependencies:
```bash
cd parrot
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
```bash
# For iOS
npm run ios

# For Android
npm run android
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
BACKEND_URL=your_backend_url
```

## Project Structure

```
parrot/
├── app/                    # Main application code
│   ├── (tabs)/            # Tab-based navigation
│   ├── (auth)/            # Authentication screens
│   └── _layout.tsx        # Root layout configuration
├── assets/                # Static assets (images, animations)
├── components/            # Reusable components
├── context/              # React Context providers
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

## Development

- Use `npm start` to start the development server
- Use `npm run ios` or `npm run android` to run on specific platforms
- Use `npm run build` to create a production build

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 