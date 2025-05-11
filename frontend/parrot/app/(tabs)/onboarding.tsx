import { useBackgroundRecording } from '../../context/BackgroundRecordingContext';

export default function Onboarding() {
  const { startBackgroundRecording } = useBackgroundRecording();

  const handleOnboardingComplete = async () => {
    try {
      // Start background recording
      await startBackgroundRecording();
      
      // Navigate to conversation screen
      // ... existing navigation code ...
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
    }
  };

  // ... rest of the component ...
} 