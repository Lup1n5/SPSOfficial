import {
    getChannels,
    getMessagesForDay,
    enqueueMessageForDelivery,
    subscribeToInbox,
    acknowledgeInboxMessage,
    subscribeToDeliveryReceipts,
    getTodayDateKey,
    getPreviousDateKey
} from './firebase.js';

class MessageManager {
    constructor(user, authManager) {
        this.user = user;
        this.authManager = authManager;
        this.currentChannel = null;
        this.todayDateKey = getTodayDateKey();

        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        this.messagesContainer = document.getElementById('messages-container');
        this.channelsList = document.getElementById('channels-list');
        this.channelTitle = document.getElementById('channel-title');
        this.channelDescription = document.getElementById('channel-description');

        this.channels = [];
        this.channelMessages = {};
        this.channelDayCursor = {};
        this.channelLoadedDays = {};
        this.deliveryReceiptsByMessageId = {};

        this.inboxSubscription = null;
        this.deliverySubscriptions = new Map();
        this.isLoadingPreviousDay = false;

        this.boundHandleMessageSubmit = (e) => this.handleMessageSubmit(e);
        this.boundHandleChannelClick = (e) => this.handleChannelClick(e);
        this.boundHandleMessagesContainerClick = (e) => this.handleMessagesContainerClick(e);
    }

    async initialize() {
        this.setupEventListeners();
        await this.loadChannels();
        await this.preloadTodayMessages();
        this.subscribeToInboxFeed();

        const defaultChannel = this.channels.some((channel) => channel.id === 'general')
            ? 'general'
            : this.channels[0]?.id;

        if (defaultChannel) {
            await this.selectChannel(defaultChannel);
        }
    }

    destroy() {
        if (this.messageForm) {
            this.messageForm.removeEventListener('submit', this.boundHandleMessageSubmit);
        }

        if (this.channelsList) {
            this.channelsList.removeEventListener('click', this.boundHandleChannelClick);
        }

        if (this.messagesContainer) {
            this.messagesContainer.removeEventListener('click', this.boundHandleMessagesContainerClick);
        }

        if (typeof this.inboxSubscription === 'function') {
            this.inboxSubscription();
            this.inboxSubscription = null;
        }

        this.deliverySubscriptions.forEach((unsub) => {
            if (typeof unsub === 'function') {
                unsub();
            }
        });
        this.deliverySubscriptions.clear();
    }

    refreshLocalUsername(newUsername) {
        if (!newUsername) {
            return;
        }

        Object.keys(this.channelMessages).forEach((channelId) => {
            this.channelMessages[channelId] = (this.channelMessages[channelId] || []).map((message) => {
                if (message.senderUid !== this.user.uid) {
                    return message;
                }

                return {
                    ...message,
                    senderUsername: newUsername
                };
            });
        });

        if (this.currentChannel) {
            this.renderMessages(this.channelMessages[this.currentChannel] || [], { scrollToBottom: false });
        }
    }

    setupEventListeners() {
        if (this.messageForm) {
            this.messageForm.addEventListener('submit', this.boundHandleMessageSubmit);
        }

        if (this.channelsList) {
            this.channelsList.addEventListener('click', this.boundHandleChannelClick);
        }

        if (this.messagesContainer) {
            this.messagesContainer.addEventListener('click', this.boundHandleMessagesContainerClick);
        }
    }

    handleMessagesContainerClick(e) {
        const historyButton = e.target.closest('#load-older-messages-btn');
        if (!historyButton) {
            return;
        }

        this.handleLoadPreviousDay();
    }

    async handleMessageSubmit(e) {
        e.preventDefault();

        const messageText = this.messageInput?.value?.trim() || '';
        if (!messageText || !this.currentChannel) {
            return;
        }

        const optimisticMessage = this.createOptimisticMessage(messageText);
        this.upsertMessage(this.currentChannel, optimisticMessage);
        this.renderMessages(this.channelMessages[this.currentChannel] || [], { scrollToBottom: true });

        if (this.messageInput) {
            this.messageInput.value = '';
            this.messageInput.focus();
        }

        const sendResult = await enqueueMessageForDelivery({
            channelId: this.currentChannel,
            senderUid: this.user.uid,
            senderUsername: this.getUsername(),
            text: messageText,
            isPing: this.isPingMessage(messageText)
        });

        this.removeMessageById(this.currentChannel, optimisticMessage.id);

        if (sendResult.success && sendResult.message) {
            this.upsertMessage(this.currentChannel, sendResult.message);
            this.trackDeliveryForMessage(sendResult.message);
            this.persistDayCache(this.currentChannel, sendResult.message.dateKey);
        } else {
            alert('Failed to send message: ' + (sendResult.error || 'Unknown error'));
        }

        this.renderMessages(this.channelMessages[this.currentChannel] || [], { scrollToBottom: true });
    }

    async loadChannels() {
        try {
            const loadedChannels = await getChannels();
            this.channels = Array.isArray(loadedChannels) ? loadedChannels : [];
            this.renderChannels();
        } catch (error) {
            console.error('Error loading channels:', error);
            this.channels = [];
            this.renderChannels();
        }
    }

    async preloadTodayMessages() {
        const preloadTasks = this.channels.map(async (channel) => {
            const todaysMessages = await this.loadMessagesForDay(channel.id, this.todayDateKey);
            this.channelMessages[channel.id] = todaysMessages;
            this.channelDayCursor[channel.id] = this.todayDateKey;
            this.channelLoadedDays[channel.id] = new Set([this.todayDateKey]);
            this.persistDayCache(channel.id, this.todayDateKey);
        });

        await Promise.all(preloadTasks);
    }

    renderChannels() {
        if (!this.channelsList) {
            return;
        }

        const existingItems = this.channelsList.querySelectorAll('.channel-item');
        existingItems.forEach((item) => item.remove());

        this.channels.forEach((channel) => {
            const li = document.createElement('li');
            li.className = `channel-item ${channel.id === this.currentChannel ? 'active' : ''}`;
            li.setAttribute('data-channel', channel.id);
            li.innerHTML = `
                <span class="channel-icon">#</span>
                <span class="channel-name">${this.escapeHtml(channel.name)}</span>
            `;
            this.channelsList.appendChild(li);
        });
    }

    async handleChannelClick(e) {
        const channelItem = e.target.closest('.channel-item');
        if (!channelItem) {
            return;
        }

        const channelId = channelItem.getAttribute('data-channel');
        await this.selectChannel(channelId);
    }

    async selectChannel(channelId) {
        if (!channelId || this.currentChannel === channelId) {
            return;
        }

        this.currentChannel = channelId;
        this.updateChannelUI();
        this.updateChannelListSelection(channelId);
        this.renderMessages(this.channelMessages[channelId] || [], { scrollToBottom: true });
        this.trackDeliveriesForCurrentChannel();

        if (this.messageInput) {
            const channelName = this.channels.find((channel) => channel.id === channelId)?.name || channelId;
            this.messageInput.placeholder = `Message #${channelName}`;
        }
    }

    updateChannelListSelection(channelId) {
        document.querySelectorAll('.channel-item').forEach((item) => {
            item.classList.toggle('active', item.getAttribute('data-channel') === channelId);
        });
    }

    updateChannelUI() {
        const channel = this.channels.find((entry) => entry.id === this.currentChannel);
        if (!channel) {
            return;
        }

        if (this.channelTitle) {
            this.channelTitle.textContent = `# ${channel.name}`;
        }

        if (this.channelDescription) {
            this.channelDescription.textContent = channel.description || '';
        }
    }

    async handleLoadPreviousDay() {
        if (!this.currentChannel || this.isLoadingPreviousDay || !this.messagesContainer) {
            return;
        }

        this.isLoadingPreviousDay = true;
        const previousScrollHeight = this.messagesContainer.scrollHeight;
        this.renderMessages(this.channelMessages[this.currentChannel] || [], { scrollToBottom: false });

        try {
            const currentCursor = this.channelDayCursor[this.currentChannel] || this.todayDateKey;
            const previousDay = getPreviousDateKey(currentCursor);

            const olderMessages = await this.loadMessagesForDay(this.currentChannel, previousDay);
            this.channelDayCursor[this.currentChannel] = previousDay;

            if (!this.channelLoadedDays[this.currentChannel]) {
                this.channelLoadedDays[this.currentChannel] = new Set();
            }
            this.channelLoadedDays[this.currentChannel].add(previousDay);

            if (olderMessages.length > 0) {
                olderMessages.forEach((message) => this.upsertMessage(this.currentChannel, message));
                this.persistDayCache(this.currentChannel, previousDay);
            }

            this.renderMessages(this.channelMessages[this.currentChannel] || [], { scrollToBottom: false });

            if (olderMessages.length > 0) {
                const nextScrollHeight = this.messagesContainer.scrollHeight;
                this.messagesContainer.scrollTop = Math.max(0, nextScrollHeight - previousScrollHeight);
            }
        } catch (error) {
            console.error('Failed loading previous day messages:', error);
        } finally {
            this.isLoadingPreviousDay = false;
            this.renderMessages(this.channelMessages[this.currentChannel] || [], { scrollToBottom: false });
        }
    }

    renderMessages(messages, options = {}) {
        if (!this.messagesContainer) {
            return;
        }

        const { scrollToBottom = false } = options;
        this.messagesContainer.innerHTML = '';

        const historyLoader = document.createElement('div');
        historyLoader.className = 'history-loader';
        historyLoader.innerHTML = `
            <button id="load-older-messages-btn" class="history-load-btn" ${this.isLoadingPreviousDay ? 'disabled' : ''}>
                ${this.isLoadingPreviousDay ? 'Loading older messages...' : 'Load Previous Day'}
            </button>
        `;
        this.messagesContainer.appendChild(historyLoader);

        if (messages.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = '<p>No messages yet. Start the conversation!</p>';
            this.messagesContainer.appendChild(emptyState);
            return;
        }

        messages.forEach((message) => {
            const messageNode = this.createMessageNode(message);
            this.messagesContainer.appendChild(messageNode);
            this.updateMessageDeliveryNode(message.id);
        });

        if (scrollToBottom) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    createMessageNode(message) {
        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group';
        messageGroup.setAttribute('data-message-id', message.id);

        const parsedTimestamp = new Date(message.timestamp);
        const timeString = Number.isNaN(parsedTimestamp.getTime())
            ? ''
            : parsedTimestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });

        const editedLabel = message.edited && !message.deleted
            ? '<span class="message-edited">(edited)</span>'
            : '';

        const pendingLabel = message.pending
            ? '<span class="message-pending">Sending...</span>'
            : '';

        const replyPreview = this.buildReplyPreview(message);
        const messageContent = message.deleted
            ? '<span class="message-deleted">This message was deleted.</span>'
            : this.escapeHtml(message.text || '');

        messageGroup.innerHTML = `
            <div class="message-header">
                <span class="message-author">${this.escapeHtml(message.senderUsername || 'User')}</span>
                <span class="message-timestamp">${timeString}</span>
                ${editedLabel}
                ${pendingLabel}
            </div>
            ${replyPreview}
            <div class="message-content">${messageContent}</div>
            <div class="message-delivery"></div>
        `;

        return messageGroup;
    }

    buildReplyPreview(message) {
        if (!message.replyToMessageId) {
            return '';
        }

        const referencedMessage = this.findMessageById(this.currentChannel, message.replyToMessageId);
        const author = referencedMessage?.senderUsername || 'Unknown user';
        const text = referencedMessage
            ? (referencedMessage.deleted ? 'This message was deleted.' : (referencedMessage.text || ''))
            : 'Original message not loaded.';

        return `
            <div class="message-reply">
                <span class="reply-author">Replying to ${this.escapeHtml(author)}</span>
                <span class="reply-text">${this.escapeHtml(this.truncateText(text, 90))}</span>
            </div>
        `;
    }

    subscribeToInboxFeed() {
        this.inboxSubscription = subscribeToInbox(this.user.uid, async (incomingMessage) => {
            if (!incomingMessage?.channelId) {
                return;
            }

            this.upsertMessage(incomingMessage.channelId, incomingMessage);
            this.persistDayCache(incomingMessage.channelId, incomingMessage.dateKey);

            if (incomingMessage.channelId === this.currentChannel) {
                this.renderMessages(this.channelMessages[this.currentChannel] || [], { scrollToBottom: true });
            }

            const acknowledgeResult = await acknowledgeInboxMessage(this.user.uid, incomingMessage, this.getUsername());
            if (!acknowledgeResult.success) {
                console.warn('Failed to acknowledge inbox message:', acknowledgeResult.error);
            }
        });
    }

    async loadMessagesForDay(channelId, dateKey) {
        const firestoreMessages = await getMessagesForDay(channelId, dateKey);
        const cachedMessages = this.readDayCache(channelId, dateKey);

        const mergedMessages = this.mergeMessagesById([
            ...cachedMessages,
            ...firestoreMessages
        ]);

        if (mergedMessages.length > 0) {
            this.writeDayCache(channelId, dateKey, mergedMessages);
        }

        return mergedMessages;
    }

    upsertMessage(channelId, rawMessage) {
        if (!channelId || !rawMessage?.id) {
            return;
        }

        if (!Array.isArray(this.channelMessages[channelId])) {
            this.channelMessages[channelId] = [];
        }

        const normalizedMessage = this.normalizeMessage(rawMessage);
        const channelMessages = this.channelMessages[channelId];
        const existingMessageIndex = channelMessages.findIndex((message) => message.id === normalizedMessage.id);

        if (existingMessageIndex === -1) {
            channelMessages.push(normalizedMessage);
        } else {
            const mergedMessage = {
                ...channelMessages[existingMessageIndex],
                ...normalizedMessage
            };

            if (normalizedMessage.deleted || normalizedMessage.text === null) {
                mergedMessage.deleted = true;
                mergedMessage.text = null;
            }

            channelMessages[existingMessageIndex] = mergedMessage;
        }

        this.channelMessages[channelId] = this.mergeMessagesById(channelMessages);
        this.trackDeliveryForMessage(normalizedMessage);
    }

    normalizeMessage(message) {
        const timestamp = message.timestamp || new Date().toISOString();

        return {
            id: message.id,
            channelId: message.channelId || this.currentChannel,
            senderUid: message.senderUid || message.userId || '',
            senderUsername: message.senderUsername || message.username || 'User',
            text: message.text ?? null,
            timestamp,
            dateKey: message.dateKey || timestamp.slice(0, 10),
            edited: Boolean(message.edited),
            deleted: Boolean(message.deleted || message.text === null),
            replyToMessageId: message.replyToMessageId || null,
            isPing: Boolean(message.isPing),
            pending: Boolean(message.pending),
            recipients: Array.isArray(message.recipients)
                ? message.recipients
                : Object.keys(message.recipientMap || {})
        };
    }

    mergeMessagesById(messages) {
        const byId = new Map();

        messages.forEach((message) => {
            if (!message?.id) {
                return;
            }

            const normalizedMessage = this.normalizeMessage(message);
            const existingMessage = byId.get(normalizedMessage.id);

            if (!existingMessage) {
                byId.set(normalizedMessage.id, normalizedMessage);
                return;
            }

            const mergedMessage = {
                ...existingMessage,
                ...normalizedMessage
            };

            if (normalizedMessage.deleted || normalizedMessage.text === null) {
                mergedMessage.deleted = true;
                mergedMessage.text = null;
            }

            byId.set(normalizedMessage.id, mergedMessage);
        });

        return Array.from(byId.values()).sort((a, b) => {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
    }

    createOptimisticMessage(text) {
        const timestamp = new Date().toISOString();

        return {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            channelId: this.currentChannel,
            senderUid: this.user.uid,
            senderUsername: this.getUsername(),
            text,
            timestamp,
            dateKey: timestamp.slice(0, 10),
            edited: false,
            deleted: false,
            replyToMessageId: null,
            isPing: this.isPingMessage(text),
            pending: true,
            recipients: []
        };
    }

    removeMessageById(channelId, messageId) {
        if (!Array.isArray(this.channelMessages[channelId])) {
            return;
        }

        this.channelMessages[channelId] = this.channelMessages[channelId]
            .filter((message) => message.id !== messageId);
    }

    trackDeliveriesForCurrentChannel() {
        const currentMessages = this.channelMessages[this.currentChannel] || [];
        currentMessages.forEach((message) => this.trackDeliveryForMessage(message));
    }

    trackDeliveryForMessage(message) {
        if (!message?.id || message.senderUid !== this.user.uid) {
            return;
        }

        if (!Array.isArray(message.recipients) || message.recipients.length === 0) {
            return;
        }

        if (this.deliverySubscriptions.has(message.id)) {
            return;
        }

        const unsubscribe = subscribeToDeliveryReceipts(message.id, (receiptsByUid) => {
            this.deliveryReceiptsByMessageId[message.id] = receiptsByUid || {};
            this.updateMessageDeliveryNode(message.id);
        });

        if (typeof unsubscribe === 'function') {
            this.deliverySubscriptions.set(message.id, unsubscribe);
        }
    }

    updateMessageDeliveryNode(messageId) {
        if (!this.messagesContainer) {
            return;
        }

        const messageNode = this.messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageNode) {
            return;
        }

        const deliveryContainer = messageNode.querySelector('.message-delivery');
        if (!deliveryContainer) {
            return;
        }

        const message = this.findMessageById(this.currentChannel, messageId);
        if (!message) {
            deliveryContainer.innerHTML = '';
            return;
        }

        deliveryContainer.innerHTML = this.getDeliveryMarkup(message);
    }

    getDeliveryMarkup(message) {
        if (message.senderUid !== this.user.uid || !Array.isArray(message.recipients) || message.recipients.length === 0) {
            return '';
        }

        const receiptsByUid = this.deliveryReceiptsByMessageId[message.id] || {};
        const deliveredEntries = Object.entries(receiptsByUid);

        if (deliveredEntries.length < message.recipients.length) {
            return '';
        }

        const recipientsList = deliveredEntries
            .map(([uid, receipt]) => {
                const username = receipt?.username || uid;
                return `<li>${this.escapeHtml(username)}</li>`;
            })
            .join('');

        return `
            <details class="delivery-dropdown">
                <summary>Delivered (${deliveredEntries.length}/${message.recipients.length})</summary>
                <ul>${recipientsList}</ul>
            </details>
        `;
    }

    findMessageById(channelId, messageId) {
        if (!channelId || !messageId) {
            return null;
        }

        return (this.channelMessages[channelId] || [])
            .find((message) => message.id === messageId) || null;
    }

    getCacheKey(channelId, dateKey) {
        return `sps-cache:messages:${this.user.uid}:${channelId}:${dateKey}`;
    }

    readDayCache(channelId, dateKey) {
        try {
            const cachedJson = localStorage.getItem(this.getCacheKey(channelId, dateKey));
            if (!cachedJson) {
                return [];
            }

            const parsedCache = JSON.parse(cachedJson);
            return Array.isArray(parsedCache)
                ? parsedCache.map((message) => this.normalizeMessage(message))
                : [];
        } catch (error) {
            console.warn('Failed reading day cache:', error);
            return [];
        }
    }

    writeDayCache(channelId, dateKey, messages) {
        try {
            localStorage.setItem(this.getCacheKey(channelId, dateKey), JSON.stringify(messages));
        } catch (error) {
            console.warn('Failed writing day cache:', error);
        }
    }

    persistDayCache(channelId, dateKey) {
        if (!channelId || !dateKey) {
            return;
        }

        const dayMessages = (this.channelMessages[channelId] || [])
            .filter((message) => message.dateKey === dateKey);

        if (dayMessages.length === 0) {
            return;
        }

        this.writeDayCache(channelId, dateKey, dayMessages);
    }

    isPingMessage(text) {
        return /@\w+/.test(text);
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) {
            return text;
        }

        return `${text.slice(0, maxLength - 1)}...`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getUsername() {
        return document.getElementById('user-name')?.textContent || 'User';
    }
}

export default MessageManager;
