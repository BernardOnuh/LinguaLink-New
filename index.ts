import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import * as WebBrowser from 'expo-web-browser';
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Ensure auth sessions are completed on iOS
WebBrowser.maybeCompleteAuthSession();
