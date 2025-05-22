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
        console.log('Google Sign In Success');
        return authentication;
      }
      return null;
    } catch (error) {
      console.log('Google Sign In Error:', error);
      return null;
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
      
      console.log('Apple Sign In Success');
      return credential;
    } catch (error) {
      console.log('Apple Sign In Error:', error);
      return null;
    }
  };

  return { signInWithApple };
}; 