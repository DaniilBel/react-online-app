import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const Chat = ({ loggedInUser }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [client, setClient] = useState(null);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws');
        // const socket = new SockJS('http://bbaev4o235muach4viii.containers.yandexcloud.net/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 15000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onStompError: function(error) {
                // display the error's message header:
                console.log(error.headers.message);
            },
            onWebSocketError: function(error) {
                // display the error's message header:
                console.log(error.headers.message);
            },
            onConnect: () => {
                console.log('Connected to WebSocket server');
                stompClient.subscribe('/topic/messages', (message) => {
                    const chatMessage = JSON.parse(message.body);
                    setMessages((prevMessages) => [...prevMessages, chatMessage]);
                });
            },
        });

        stompClient.activate();
        setClient(stompClient);

        return () => {
            stompClient.deactivate();
        };
    }, []);

    const handleSend = () => {
        if (input.trim() && loggedInUser && client) {
            const message = { sender: loggedInUser, content: input };
            client.publish({ destination: '/app/chat', body: JSON.stringify(message) });
            setInput('');
        }
    };

    return (
        <div className="chat">
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index} className="chat-message">
                        <strong>{msg.sender}:</strong> {msg.content}
                    </div>
                ))}
            </div>
            {loggedInUser && (
                <div className="chat-input">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message"
                    />
                    <button onClick={handleSend}>Send</button>
                </div>
            )}
        </div>
    );
};

export default Chat;
