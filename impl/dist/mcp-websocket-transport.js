// @ts-nocheck
class MCPWebSocketTransport {
    connected = false;
    url = null;
    pendingRequests = new Map();
    messageQueue = [];
    listeners = new Set();
    requestId = 0;
    /**
     * Connect
     */
    async connect(url) {
        this.url = url;
        // Would create WebSocket connection
        // For demo, simulate
        this.connected = true;
        return true;
    }
    /**
     * Disconnect
     */
    disconnect() {
        this.connected = false;
        this.url = null;
        // Reject pending requests
        for (const [id, { reject }] of this.pendingRequests) {
            reject(new Error('Connection closed'));
        }
        this.pendingRequests.clear();
    }
    /**
     * Is connected
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Send request
     */
    async sendRequest(method, params) {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        const id = `req-${++this.requestId}`;
        const message = {
            type: 'request',
            method,
            id,
            params
        };
        // Would send over WebSocket
        // For demo, simulate response
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            // Simulate response
            setTimeout(() => {
                const pending = this.pendingRequests.get(id);
                if (pending) {
                    pending.resolve({ success: true, simulated: true });
                    this.pendingRequests.delete(id);
                }
            }, 100);
        });
    }
    /**
     * Send notification
     */
    sendNotification(method, params) {
        if (!this.connected)
            return;
        const message = {
            type: 'notification',
            method,
            params
        };
        this.messageQueue.push(message);
    }
    /**
     * Handle response
     */
    handleResponse(message) {
        if (!message.id)
            return;
        const pending = this.pendingRequests.get(message.id);
        if (!pending)
            return;
        if (message.error) {
            pending.reject(message.error);
        }
        else {
            pending.resolve(message.result);
        }
        this.pendingRequests.delete(message.id);
    }
    /**
     * Receive message
     */
    receive(message) {
        if (message.type === 'response') {
            this.handleResponse(message);
        }
        // Notify listeners
        for (const listener of this.listeners) {
            listener(message);
        }
    }
    /**
     * Subscribe
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Get pending requests
     */
    getPendingCount() {
        return this.pendingRequests.size;
    }
    /**
     * Get message queue
     */
    getMessageQueue() {
        return [...this.messageQueue];
    }
    /**
     * Clear queue
     */
    clearQueue() {
        this.messageQueue = [];
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            connected: this.connected,
            url: this.url,
            pendingCount: this.pendingRequests.size,
            queueCount: this.messageQueue.length,
            listenersCount: this.listeners.size
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.disconnect();
        this.messageQueue = [];
        this.listeners.clear();
        this.requestId = 0;
    }
}
// Global singleton
export const mcpWebSocketTransport = new MCPWebSocketTransport();
export default mcpWebSocketTransport;
//# sourceMappingURL=mcp-websocket-transport.js.map