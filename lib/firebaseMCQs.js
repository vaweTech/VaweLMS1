"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Second Firebase configuration for MCQs and Progress Tests
const firebaseMCQConfig = {
  apiKey: "AIzaSyDnrfMoTNMlghOiQ3hzevfTAKJpUaeC7yA",
  authDomain: "questions-for-lms.firebaseapp.com",
  projectId: "questions-for-lms",
  storageBucket: "questions-for-lms.firebasestorage.app",
  messagingSenderId: "979937209773",
  appId: "1:979937209773:web:0f1dcfea907ce75af50524",
  measurementId: "G-TDVWRXXNFR"
};

// ✅ Initialize the second Firebase app with a unique name
let mcqApp;
const existingMCQApp = getApps().find(app => app.name === 'mcq-firebase');

if (!existingMCQApp) {
  mcqApp = initializeApp(firebaseMCQConfig, 'mcq-firebase');
} else {
  mcqApp = existingMCQApp;
}

// Analytics (only client-side)
let mcqAnalytics = null;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) mcqAnalytics = getAnalytics(mcqApp);
  });
}

// 🔑 Exports for MCQ Firebase
export const mcqDb = getFirestore(mcqApp);

export const mcqFirestoreHelpers = {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
};

export default mcqApp;

