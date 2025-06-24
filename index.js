/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// import { initializeApp, getApps } from '@react-native-firebase/app';

// if (!getApps().length) {
//   initializeApp();
// }

AppRegistry.registerComponent(appName, () => App);
