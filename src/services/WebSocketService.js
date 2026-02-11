import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

// Define the WebSocket endpoints
const BACKEND_URL = import.meta.env.VITE_WS_URL;
const WS_PROTOCOL = BACKEND_URL.startsWith('https') ? 'wss' : 'ws';
const WS_BASE = BACKEND_URL.replace(/^https?:\/\//, '');

const WS_NATIVE_ENDPOINT = `${WS_PROTOCOL}://${WS_BASE}/ws-native`;
const WS_SOCKJS_ENDPOINT = `${BACKEND_URL}/ws`;


class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.connecting = false; // Track if connection is in progress
        this.authToken = null;
    }

    setAuthToken(token) {
        this.authToken = token;
    }

    connect(onConnect, onError) {
        console.log('[WebSocketService] connect() called', {
            connected: this.connected,
            connecting: this.connecting,
            hasClient: !!this.stompClient
        });

        // If already connected, just call the callback
        if (this.stompClient && this.connected) {
            console.log('[WebSocketService] Already connected, calling onConnect callback');
            if (onConnect) onConnect();
            return;
        }

        // If already connecting, don't start another connection
        if (this.connecting) {
            console.log('[WebSocketService] Connection already in progress, ignoring duplicate call');
            return;
        }

        this.connecting = true;
        console.log('[WebSocketService] Starting new WebSocket connection to:', WS_NATIVE_ENDPOINT);

        // Try native WebSocket first for clearer debugging in the browser
        this.stompClient = Stomp.client(WS_NATIVE_ENDPOINT);

        // Enable debug logs to help diagnose connection issues
        this.stompClient.debug = (str) => { console.log('STOMP:', str); };

        const headers = this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};

        this.stompClient.connect(headers,
            () => {
                console.log('[WebSocketService] Connection SUCCESS (native)');
                this.connecting = false;
                this.connected = true;
                if (onConnect) onConnect();
            },
            (error) => {
                console.error('[WebSocketService] Connection FAILED (native):', error);

                // Fallback to SockJS if native WebSocket fails
                console.log('[WebSocketService] Falling back to SockJS:', WS_SOCKJS_ENDPOINT);
                const socket = new SockJS(WS_SOCKJS_ENDPOINT);
                this.stompClient = Stomp.over(socket);
                this.stompClient.debug = (str) => { console.log('STOMP:', str); };

                this.stompClient.connect(headers,
                    () => {
                        console.log('[WebSocketService] Connection SUCCESS (sockjs)');
                        this.connecting = false;
                        this.connected = true;
                        if (onConnect) onConnect();
                    },
                    (sockErr) => {
                        console.error('[WebSocketService] Connection FAILED (sockjs):', sockErr);
                        this.connecting = false;
                        this.connected = false;
                        if (onError) onError(sockErr);
                    }
                );
            }
        );
    }

    subscribe(topic, callback) {
        if (!this.stompClient || !this.connected) {
            console.warn('Cannot subscribe: Not connected to WebSocket');
            return null;
        }
        return this.stompClient.subscribe(topic, (message) => {
            try {
                callback(JSON.parse(message.body));
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        });
    }

    send(destination, body) {
        if (!this.stompClient || !this.connected) {
            console.warn('Cannot send: Not connected to WebSocket');
            return;
        }
        this.stompClient.send(destination, {}, JSON.stringify(body));
    }

    disconnect() {
        if (this.stompClient) {
            // Check if STOMP is actually connected before calling disconnect
            if (this.stompClient.connected) {
                try {
                    this.stompClient.disconnect();
                } catch (e) {
                    console.warn('Silent error during STOMP disconnect:', e);
                }
            }
            this.stompClient = null;
        }
        this.connecting = false;
        this.connected = false;
        console.log('Disconnected from WebSocket');
    }
}

export const webSocketService = new WebSocketService();
