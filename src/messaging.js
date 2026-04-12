import {
    sendMessage,
    getMessages,
    subscribeToMessages,
    getChannels,
    createChannel
} from './firebase.js';

class MessageManager {
    constructor(user, authManager) {
        this.user = user;
        this.authManager = authManager;
        this.currentChannel = 'general';
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        this.messagesContainer = document.getElementById('messages-container');
        this.channelsList = document.getElementById('channels-list');
        this.channelTitle = document.getElementById('channel-title');
        this.channelDescription = document.getElementById('channel-description');
        this.addChannelBtn = document.getElementById('add-channel-btn');
        
        this.messageSubscriptions = [];
        this.messages = {};
        this.channels = [];

        this.setupEventListeners();
        this.loadChannels();
    }

    setupEventListeners() {
        this.messageForm.addEventListener('submit', (e) => this.handleMessageSubmit(e));
        this.addChannelBtn.addEventListener('click', () => this.handleAddChannel());
        this.channelsList.addEventListener('click', (e) => this.handleChannelClick(e));
    }

    async handleMessageSubmit(e) {
        e.preventDefault();

        const messageText = this.messageInput.value.trim();
        if (!messageText) return;

        const result = await sendMessage(
            this.currentChannel,
            this.user.uid,
            this.getUsername(),
            messageText
        );

        if (result.success) {
            this.messageInput.value = '';
            this.messageInput.focus();
        } else {
            alert('Failed to send message: ' + result.error);
        }
    }

    async loadChannels() {
        try {
            // For now, we'll use predefined channels
            this.channels = [
                { id: 'general', name: 'general', description: 'Public channel for server-wide discussions' },
                { id: 'introductions', name: 'introductions', description: 'Introduce yourself to the community' }
            ];

            this.renderChannels();
            await this.selectChannel('general');
        } catch (error) {
            console.error('Error loading channels:', error);
        }
    }

    renderChannels() {
        // Clear existing items except the first ones we've already added
        const existingItems = this.channelsList.querySelectorAll('.channel-item');
        existingItems.forEach(item => item.remove());

        // Re-render all channels
        this.channels.forEach(channel => {
            const li = document.createElement('li');
            li.className = `channel-item ${channel.id === this.currentChannel ? 'active' : ''}`;
            li.setAttribute('data-channel', channel.id);
            li.innerHTML = `
                <span class="channel-icon">#</span>
                <span class="channel-name">${channel.name}</span>
            `;
            this.channelsList.appendChild(li);
        });
    }

    async handleChannelClick(e) {
        const channelItem = e.target.closest('.channel-item');
        if (!channelItem) return;

        const channelId = channelItem.getAttribute('data-channel');
        await this.selectChannel(channelId);
    }

    async selectChannel(channelId) {
        if (this.currentChannel === channelId) return;

        // Remove old subscription
        this.messageSubscriptions.forEach(unsub => {
            if (unsub) unsub();
        });
        this.messageSubscriptions = [];

        // Update active channel
        this.currentChannel = channelId;
        this.updateChannelUI();

        // Load messages
        await this.loadMessages(channelId);

        // Subscribe to new messages
        const unsubscribe = subscribeToMessages(channelId, (message) => {
            this.addMessageToUI(message);
        });

        if (unsubscribe) {
            this.messageSubscriptions.push(unsubscribe);
        }

        // Update channel list UI
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-channel') === channelId);
        });

        // Update placeholder
        const channelName = this.channels.find(c => c.id === channelId)?.name || channelId;
        this.messageInput.placeholder = `Message #${channelName}`;
    }

    updateChannelUI() {
        const channel = this.channels.find(c => c.id === this.currentChannel);
        if (channel) {
            this.channelTitle.textContent = `# ${channel.name}`;
            this.channelDescription.textContent = channel.description;
        }
    }

    async loadMessages(channelId) {
        try {
            const messages = await getMessages(channelId);
            this.messages[channelId] = messages;
            this.renderMessages(messages);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    renderMessages(messages) {
        this.messagesContainer.innerHTML = '';

        if (messages.length === 0) {
            this.messagesContainer.innerHTML = `
                <div class="empty-state">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }

        messages.forEach(message => {
            this.addMessageToUI(message, true);
        });

        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    addMessageToUI(message, isHistorical = false) {
        // Check if message already exists
        if (this.messagesContainer.querySelector(`[data-message-id="${message.id}"]`)) {
            return;
        }

        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group';
        messageGroup.setAttribute('data-message-id', message.id);

        const timeString = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageGroup.innerHTML = `
            <div class="message-header">
                <span class="message-author">${message.username}</span>
                <span class="message-timestamp">${timeString}</span>
            </div>
            <div class="message-content">${this.escapeHtml(message.text)}</div>
        `;

        if (isHistorical) {
            this.messagesContainer.appendChild(messageGroup);
        } else {
            // For new messages, add and scroll
            this.messagesContainer.appendChild(messageGroup);
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async handleAddChannel() {
        const channelName = prompt('Enter channel name:');
        if (!channelName) return;

        const description = prompt('Enter channel description (optional):');

        const result = await createChannel(channelName, description || '');
        if (result.success) {
            const newChannel = {
                id: result.channelId,
                name: channelName,
                description: description || ''
            };
            this.channels.push(newChannel);
            this.renderChannels();
        } else {
            alert('Failed to create channel: ' + result.error);
        }
    }

    getUsername() {
        return document.getElementById('user-name').textContent || 'User';
    }
}

export default MessageManager;
