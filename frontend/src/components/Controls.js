import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const Controls = ({ loggedInUser }) => {
    const [votes, setVotes] = useState({});
    const [selectedVote, setSelectedVote] = useState(null);
    const [client, setClient] = useState(null);
    const [remainingTime, setRemainingTime] = useState(60);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WebSocket server');
                stompClient.subscribe('/topic/votes', (message) => {
                    const voteCounts = JSON.parse(message.body);
                    console.log('Received votes:', voteCounts);
                    setVotes(voteCounts);
                });
                stompClient.subscribe('/topic/timer', (message) => {
                    const time = JSON.parse(message.body);
                    console.log('Received timer:', time);
                    setRemainingTime(time);
                });
                stompClient.subscribe('/topic/messages', (message) => {
                    const chatMessage = JSON.parse(message.body);
                    console.log('Received message:', chatMessage);
                    if (chatMessage.sender === 'system') {
                        // Обнуляем голоса после получения системного сообщения о завершении голосования
                        setVotes({});
                    }
                });
            },
        });

        stompClient.activate();
        setClient(stompClient);

        return () => {
            stompClient.deactivate();
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (client) {
                client.publish({ destination: '/app/timer' });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [client]);

    const handleVote = (direction) => {
        if (loggedInUser && client) {
            setSelectedVote(direction);
            client.publish({ destination: '/app/vote', body: JSON.stringify({ username: loggedInUser, direction }) });
        }
    };

    return (
        <div className="controls">
            <div className="timer">
                <div className="progress-bar">
                    <div
                        className="progress"
                        style={{ width: `${(remainingTime / 60) * 100}%` }}
                    />
                </div>
                <p>{remainingTime} seconds remaining</p>
            </div>
            <div className="arrow-buttons">
                <button onClick={() => handleVote('up')}>
                    ↑ {votes.up || 0}
                </button>
                <div>
                    <button onClick={() => handleVote('left')}>
                        ← {votes.left || 0}
                    </button>
                    <button onClick={() => handleVote('down')}>
                        ↓ {votes.down || 0}
                    </button>
                    <button onClick={() => handleVote('right')}>
                        → {votes.right || 0}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Controls;
