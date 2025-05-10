import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, REDIRECT_URI } from '../config/auth';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  const signInWithGoogle = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const { authentication } = result;
        // Here you would typically send the token to your backend
        console.log('Google Sign In Success:', authentication);
        return authentication;
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  return { signInWithGoogle };
};

export const useAppleAuth = () => {
  const signInWithApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      // Here you would typically send the credential to your backend
      console.log('Apple Sign In Success:', credential);
      return credential;
    } catch (error) {
      console.error('Apple Sign In Error:', error);
      throw error;
    }
  };

  return { signInWithApple };
}; 