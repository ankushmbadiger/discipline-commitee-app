"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWithEmail = registerWithEmail;
exports.loginWithEmail = loginWithEmail;
exports.logout = logout;
exports.getAuthToken = getAuthToken;
const auth_1 = require("firebase/auth");
const firebase_1 = require("./firebase");
async function registerWithEmail(email, password) {
    const credential = await (0, auth_1.createUserWithEmailAndPassword)(firebase_1.auth, email.trim(), password);
    return credential.user;
}
async function loginWithEmail(email, password) {
    const credential = await (0, auth_1.signInWithEmailAndPassword)(firebase_1.auth, email.trim(), password);
    return credential.user;
}
async function logout() {
    await (0, auth_1.signOut)(firebase_1.auth);
}
async function getAuthToken() {
    const user = firebase_1.auth.currentUser;
    if (!user) {
        return null;
    }
    return (0, auth_1.getIdToken)(user);
}
//# sourceMappingURL=auth.js.map