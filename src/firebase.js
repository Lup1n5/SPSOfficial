import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { getDatabase, ref, get, set, push, update, onChildAdded, onValue } from 'firebase/database';
import { getFirestore, collection, doc, getDoc, getDocs } from 'firebase/firestore';

let app = null;
let auth = null;
let db = null;
let firestore = null;

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;

const getDateKeyFromTimestamp = (timestamp = new Date().toISOString()) => {
    const parsedDate = new Date(timestamp);
    if (Number.isNaN(parsedDate.getTime())) {
        return new Date().toISOString().slice(0, 10);
    }

    return parsedDate.toISOString().slice(0, 10);
};

const buildDefaultUsername = (email = '') => {
    const emailPrefix = (email.split('@')[0] || '').trim();
    if (!emailPrefix) {
        return 'User';
    }

    return emailPrefix.slice(0, USERNAME_MAX_LENGTH);
};

const normalizeMessageEnvelope = (message = {}) => {
    const timestamp = message.timestamp || new Date().toISOString();
    const recipientUids = Array.isArray(message.recipients)
        ? message.recipients
        : Object.keys(message.recipientMap || {});

    return {
        id: message.id || '',
        channelId: message.channelId || 'general',
        senderUid: message.senderUid || message.userId || '',
        senderUsername: message.senderUsername || message.username || 'User',
        text: message.text ?? null,
        timestamp,
        dateKey: message.dateKey || getDateKeyFromTimestamp(timestamp),
        edited: Boolean(message.edited),
        deleted: Boolean(message.deleted || message.text === null),
        replyToMessageId: message.replyToMessageId || null,
        isPing: Boolean(message.isPing),
        recipients: recipientUids,
        recipientMap: message.recipientMap || recipientUids.reduce((acc, uid) => {
            acc[uid] = true;
            return acc;
        }, {})
    };
};

const sortMessagesByTimestamp = (messages = []) => {
    return [...messages].sort((a, b) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
};

const sanitizeSubscriptionKey = (endpoint) => {
    return endpoint
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(-120);
};

export const initializeFirebase = (config) => {
    try {
        app = initializeApp(config);
        auth = getAuth(app);
        db = getDatabase(app);
        firestore = getFirestore(app);
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
};

export const getFirebaseServices = () => ({
    auth,
    db,
    firestore
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
export const upsertCurrentUserProfile = async (user) => {
    if (!user?.uid) {
        return { success: false, error: 'Missing authenticated user.' };
    }

    try {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const nowIso = new Date().toISOString();
        const defaultUsername = buildDefaultUsername(user.email);

        if (!snapshot.exists()) {
            const profile = {
                uid: user.uid,
                email: user.email || '',
                username: defaultUsername,
                createdAt: nowIso,
                updatedAt: nowIso,
                lastSeen: nowIso
            };

            await set(userRef, profile);
            return { success: true, profile };
        }

        const existingProfile = snapshot.val() || {};
        const profilePatch = {};

        if (!existingProfile.uid) {
            profilePatch.uid = user.uid;
        }

        if (!existingProfile.email && user.email) {
            profilePatch.email = user.email;
        }

        if (!existingProfile.username) {
            profilePatch.username = defaultUsername;
        }

        if (Object.keys(profilePatch).length > 0) {
            profilePatch.updatedAt = nowIso;
            await update(userRef, profilePatch);
        }

        return {
            success: true,
            profile: {
                ...existingProfile,
                ...profilePatch
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

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

export const updateUsername = async (uid, username) => {
    const normalizedUsername = (username || '').trim();

    if (!uid) {
        return { success: false, error: 'Missing user id.' };
    }

    if (normalizedUsername.length < USERNAME_MIN_LENGTH) {
        return { success: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters.` };
    }

    if (normalizedUsername.length > USERNAME_MAX_LENGTH) {
        return { success: false, error: `Username must be ${USERNAME_MAX_LENGTH} characters or less.` };
    }

    try {
        await update(ref(db, `users/${uid}`), {
            username: normalizedUsername,
            updatedAt: new Date().toISOString()
        });

        return {
            success: true,
            username: normalizedUsername
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

export const updateUserLastSeen = async (uid) => {
    try {
        await set(ref(db, `users/${uid}/lastSeen`), new Date().toISOString());
    } catch (error) {
        console.error('Error updating last seen:', error);
    }
};

// Channel Functions
export const getChannels = async () => {
    try {
        const channelsCollectionRef = collection(firestore, 'channels');
        const channelsSnapshot = await getDocs(channelsCollectionRef);

        if (channelsSnapshot.empty) {
            console.warn('No channels found in Firestore. Please create channels in Firebase Console.');
            return [];
        }

        const channels = channelsSnapshot.docs.map((channelDoc) => {
            const data = channelDoc.data() || {};
            return {
                id: channelDoc.id,
                name: data.name || channelDoc.id,
                description: data.description || '',
                participantUids: Array.isArray(data.participantUids) ? data.participantUids : []
            };
        });

        return channels.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('Error fetching channels from Firestore:', error);
        console.error('Make sure Firestore is initialized and has a "channels" collection.');
        return [];
    }
};

// Firestore History Functions
export const getTodayDateKey = () => new Date().toISOString().slice(0, 10);

export const getPreviousDateKey = (dateKey) => {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
};

export const getMessagesForDay = async (channelId, dateKey = getTodayDateKey()) => {
    try {
        const dayRef = doc(firestore, 'channelHistory', channelId, 'days', dateKey);
        const snapshot = await getDoc(dayRef);

        if (!snapshot.exists()) {
            return [];
        }

        const data = snapshot.data() || {};
        const rawMessages = Array.isArray(data.messages) ? data.messages : [];

        return sortMessagesByTimestamp(
            rawMessages
                .map((message) => normalizeMessageEnvelope(message))
                .filter((message) => Boolean(message.id))
        );
    } catch (error) {
        console.error('Error fetching Firestore day messages:', error);
        return [];
    }
};

export const getMessagesForChannelsForDay = async (channelIds, dateKey = getTodayDateKey()) => {
    const loadedEntries = await Promise.all(
        channelIds.map(async (channelId) => {
            const messages = await getMessagesForDay(channelId, dateKey);
            return [channelId, messages];
        })
    );

    return Object.fromEntries(loadedEntries);
};

const getChannelRecipientUids = async (channelId, senderUid) => {
    try {
        const channelDocRef = doc(firestore, 'channels', channelId);
        const channelSnapshot = await getDoc(channelDocRef);
        if (channelSnapshot.exists()) {
            const channelData = channelSnapshot.data() || {};
            const participantUids = Array.isArray(channelData.participantUids)
                ? channelData.participantUids
                : [];

            const channelRecipients = participantUids.filter((uid) => uid !== senderUid);
            if (channelRecipients.length > 0) {
                return channelRecipients;
            }
        }
    } catch (error) {
        console.warn('Failed to load channel participants, falling back to user list:', error);
    }

    const usersSnapshot = await get(ref(db, 'users'));
    if (!usersSnapshot.exists()) {
        return [];
    }

    const allUserIds = Object.keys(usersSnapshot.val() || {});
    return allUserIds.filter((uid) => uid !== senderUid);
};

export const enqueueMessageForDelivery = async ({
    channelId,
    senderUid,
    senderUsername,
    text,
    replyToMessageId = null,
    isPing = false,
    id = null,
    timestamp = null,
    edited = false,
    deleted = false
}) => {
    if (!channelId || !senderUid) {
        return { success: false, error: 'Missing required message fields.' };
    }

    try {
        const queueRef = ref(db, 'queues/server');
        const generatedMessageRef = push(queueRef);
        const messageId = id || generatedMessageRef.key;
        const resolvedTimestamp = timestamp || new Date().toISOString();
        const recipients = await getChannelRecipientUids(channelId, senderUid);

        const messageEnvelope = normalizeMessageEnvelope({
            id: messageId,
            channelId,
            senderUid,
            senderUsername,
            text,
            timestamp: resolvedTimestamp,
            dateKey: getDateKeyFromTimestamp(resolvedTimestamp),
            edited,
            deleted,
            replyToMessageId,
            isPing,
            recipients
        });

        const rootUpdates = {
            [`queues/server/${messageId}`]: messageEnvelope
        };

        recipients.forEach((recipientUid) => {
            rootUpdates[`inboxes/${recipientUid}/${messageId}`] = messageEnvelope;
        });

        await update(ref(db), rootUpdates);

        return {
            success: true,
            message: messageEnvelope
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

export const subscribeToInbox = (uid, callback) => {
    try {
        const inboxRef = ref(db, `inboxes/${uid}`);
        return onChildAdded(inboxRef, (snapshot) => {
            const rawMessage = snapshot.val();
            if (!rawMessage) {
                return;
            }

            callback(normalizeMessageEnvelope(rawMessage));
        });
    } catch (error) {
        console.error('Error subscribing to inbox:', error);
        return null;
    }
};

export const acknowledgeInboxMessage = async (uid, message, username = '') => {
    if (!uid || !message?.id) {
        return { success: false, error: 'Missing inbox acknowledgment fields.' };
    }

    try {
        const receiptTimestamp = new Date().toISOString();
        const rootUpdates = {
            [`deliveryReceipts/${message.id}/${uid}`]: {
                username: username || uid,
                deliveredAt: receiptTimestamp
            },
            [`inboxes/${uid}/${message.id}`]: null
        };

        await update(ref(db), rootUpdates);

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

export const subscribeToDeliveryReceipts = (messageId, callback) => {
    try {
        const receiptsRef = ref(db, `deliveryReceipts/${messageId}`);
        return onValue(receiptsRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    } catch (error) {
        console.error('Error subscribing to delivery receipts:', error);
        return null;
    }
};

export const savePushSubscription = async (uid, subscriptionJson) => {
    if (!uid || !subscriptionJson?.endpoint) {
        return { success: false, error: 'Missing push subscription payload.' };
    }

    try {
        const subscriptionKey = sanitizeSubscriptionKey(subscriptionJson.endpoint);
        const subscriptionRef = ref(db, `pushSubscriptions/${uid}/${subscriptionKey}`);

        await set(subscriptionRef, {
            ...subscriptionJson,
            updatedAt: new Date().toISOString()
        });

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Legacy compatibility exports
export const sendMessage = async (channelId, userId, username, messageText) => {
    return enqueueMessageForDelivery({
        channelId,
        senderUid: userId,
        senderUsername: username,
        text: messageText
    });
};

export const getMessages = async (channelId) => {
    return getMessagesForDay(channelId, getTodayDateKey());
};

export const subscribeToMessages = () => {
    return null;
};

export const createChannel = async () => {
    return {
        success: false,
        error: 'Channel creation is managed by backend services.'
    };
};
