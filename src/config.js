// Firebase Configuration
// Get these values from your Firebase Console > Project Settings

// Load from environment variables if available, otherwise use defaults
const getConfig = () => {
    // Check for environment variables (Vite)
    // Fallback to direct configuration
    // Update these with your Firebase credentials from
    // Firebase Console > Project Settings > General
    return {
        apiKey: "AIzaSyAYjLbsdGgVccTHa_bpEaDh7orYmzldiMk",
        authDomain: "stewflandic-permission-system.firebaseapp.com",
        databaseURL: "https://stewflandic-permission-system-default-rtdb.firebaseio.com",
        projectId: "stewflandic-permission-system",
        storageBucket: "stewflandic-permission-system.firebasestorage.app",
        messagingSenderId: "1035943934052",
        appId: "1:1035943934052:web:d3b8c6802c9a99ec81c771"
    };
};

export const firebaseConfig = getConfig();
