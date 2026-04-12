import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { getDatabase, ref, get, set, push, onChildAdded } from 'firebase/database';

let app = null;
let auth = null;
let db = null;

export const initializeFirebase = (config) => {
    try {
        app = initializeApp(config);
        auth = getAuth(app);
        db = getDatabase(app);
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
};

export const getFirebaseServices = () => ({
    auth,
    db
});

// Auth Functions
export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
};

export const signupUser = async (email, password, username) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Store user profile in database
        await set(ref(db, `users/${user.uid}`), {
            uid: user.uid,
            email: email,
            username: username,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        });
        
        return { success: true, user };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
};

export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => {
    return auth.currentUser;
};

// User Profile Functions
export const getUserProfile = async (uid) => {
    try {
        const snapshot = await get(ref(db, `users/${uid}`));
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

export const updateUserLastSeen = async (uid) => {
    try {
        await set(ref(db, `users/${uid}/lastSeen`), new Date().toISOString());
    } catch (error) {
        console.error('Error updating last seen:', error);
    }
};

// Messaging Functions
export const sendMessage = async (channelId, userId, username, message) => {
    try {
        const messagesRef = ref(db, `channels/${channelId}/messages`);
        const newMessageRef = push(messagesRef);
        
        await set(newMessageRef, {
            id: newMessageRef.key,
            userId: userId,
            username: username,
            text: message,
            timestamp: new Date().toISOString(),
            edited: false
        });
        
        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
};

export const getMessages = async (channelId) => {
    try {
        const snapshot = await get(ref(db, `channels/${channelId}/messages`));
        if (snapshot.exists()) {
            const messages = [];
            snapshot.forEach(childSnapshot => {
                messages.push(childSnapshot.val());
            });
            return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        return [];
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
};

export const subscribeToMessages = (channelId, callback) => {
    try {
        const messagesRef = ref(db, `channels/${channelId}/messages`);
        return onChildAdded(messagesRef, (snapshot) => {
            callback(snapshot.val());
        });
    } catch (error) {
        console.error('Error subscribing to messages:', error);
        return null;
    }
};

// Channel Functions
export const getChannels = async () => {
    try {
        const snapshot = await get(ref(db, 'channels'));
        if (snapshot.exists()) {
            const channels = [];
            snapshot.forEach(childSnapshot => {
                channels.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            return channels;
        }
        return [];
    } catch (error) {
        console.error('Error fetching channels:', error);
        return [];
    }
};

export const createChannel = async (channelName, description = '') => {
    try {
        const channelsRef = ref(db, 'channels');
        const newChannelRef = push(channelsRef);
        
        await set(newChannelRef, {
            name: channelName,
            description: description,
            createdAt: new Date().toISOString()
        });
        
        return { success: true, channelId: newChannelRef.key };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
};
