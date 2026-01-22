import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBjqqeIQBMfELvW5gTaARKPM6rhD7M26HY",
    authDomain: "learncopilot-39d16.firebaseapp.com",
    projectId: "learncopilot-39d16",
    storageBucket: "learncopilot-39d16.firebasestorage.app",
    messagingSenderId: "355308332046",
    appId: "1:355308332046:web:90f7e8c641fff43b2a885f",
    measurementId: "G-818979SJ35"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
