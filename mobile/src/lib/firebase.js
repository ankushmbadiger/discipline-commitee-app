"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.app = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const app = (0, app_1.getApps)().length === 0
    ? (0, app_1.initializeApp)(firebaseConfig)
    : (0, app_1.getApp)();
exports.app = app;
let auth;
try {
    exports.auth = auth = (0, auth_1.initializeAuth)(app, {
        persistence: (0, auth_1.getReactNativePersistence)(async_storage_1.default),
    });
}
catch {
    exports.auth = auth = (0, auth_1.getAuth)(app);
}
//# sourceMappingURL=firebase.js.map