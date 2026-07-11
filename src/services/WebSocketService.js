import { Client } from '@stomp/stompjs';

const BACKEND_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8082';
const WS_URL = BACKEND_URL.replace(/^http/, 'ws') + '/ws-native';

class WebSocketService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.connecting = false;
        this.authToken = null;
    }

    setAuthToken(token) {
        this.authToken = token;
    }

    connect(onConnect, onError) {
        if (this.client && this.connected) {
            if (onConnect) onConnect();
            return;
        }
        if (this.connecting) return;
        // Clean up any stale client
        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }
        this.connecting = true;

        const headers = this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};

        this.client = new Client({
            brokerURL: WS_URL,
            connectHeaders: headers,
            reconnectDelay: 0,
            onConnect: () => {
                this.connecting = false;
                this.connected = true;
                if (onConnect) onConnect();
            },
            onStompError: (frame) => {
                console.error('[WS] STOMP error:', frame);
                this.connecting = false;
                this.connected = false;
                if (onError) onError(frame);
            },
            onDisconnect: () => {
                console.warn('[WS] STOMP disconnected');
                this.connected = false;
            },
            onWebSocketError: (event) => {
                console.error('[WS] WebSocket error:', event);
                this.connecting = false;
                this.connected = false;
                if (onError) onError(event);
            },
            onWebSocketClose: (event) => {
                console.warn('[WS] WebSocket closed:', event.code, event.reason);
                this.connecting = false;
                this.connected = false;
            },
        });

        this.client.activate();
    }

    subscribe(topic, callback) {
        if (!this.client || !this.connected) {
            console.warn('Cannot subscribe: Not connected to WebSocket');
            return null;
        }
        return this.client.subscribe(topic, (message) => {
            try {
                callback(JSON.parse(message.body));
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        });
    }

    send(destination, body) {
        if (!this.client || !this.connected) {
            console.warn('Cannot send: Not connected to WebSocket');
            return;
        }
        this.client.publish({ destination, body: JSON.stringify(body) });
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }
        this.connecting = false;
        this.connected = false;
    }
}

export const webSocketService = new WebSocketService();
