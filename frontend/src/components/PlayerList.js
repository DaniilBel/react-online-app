import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const PlayerList = ({ setLoggedInUser }) => {
    const [players, setPlayers] = useState([]);
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loggedInUser, setLocalLoggedInUser] = useState(null);
    const [error, setError] = useState('');
    const [client, setClient] = useState(null);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws');

        // const socket = new SockJS('http://bba8mn43mvel1jncd95g.containers.yandexcloud.net/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WebSocket server');
                stompClient.subscribe('/topic/onlineUsers', (message) => {
                    const onlineUsers = JSON.parse(message.body);
                    setPlayers(onlineUsers.map(user => user.nickname));
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
        if (loggedInUser && client) {
            const interval = setInterval(() => {
                client.publish({ destination: '/app/ping', body: JSON.stringify({ nickname: loggedInUser }) });
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [loggedInUser, client]);

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:8080/api/users/authenticate', {
                nickname,
                email,
                password,
            }, { withCredentials: true });
            if (response.data) {
                setLocalLoggedInUser(response.data.nickname);
                setLoggedInUser(response.data.nickname);
                if (!players.includes(response.data.nickname)) {
                    setPlayers([...players, response.data.nickname]);
                }
                setError('');
            } else {
                setError('Неверный пароль');
            }
        } catch (error) {
            console.error(error);
            setError('Произошла ошибка при аутентификации');
        }
    };

    const handleRegister = async () => {
        try {
            const response = await axios.post('http://localhost:8080/api/users', {
                nickname,
                password,
            }, { withCredentials: true });
            if (response.data) {
                setLocalLoggedInUser(nickname);
                setLoggedInUser(nickname);
                setPlayers([...players, nickname]);
                setError('');
            }
        } catch (error) {
            console.error(error);
            setError('Произошла ошибка при регистрации');
        }
    };

    return (
        <div className="player-list">
            <h3>Players</h3>
            <ul>
                {players.map((player, index) => (
                    <li key={index}>{player}</li>
                ))}
            </ul>
            {loggedInUser ? (
                <div className="logged-in">
                    <p>{loggedInUser}, вы онлайн</p>
                </div>
            ) : (
                <div className="login-form">
                    <input
                        type="text"
                        placeholder="Nickname"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={handleLogin}>Login</button>
                    <button onClick={handleRegister}>Register</button>
                    {error && <p className="error">{error}</p>}
                </div>
            )}
        </div>
    );
};

export default PlayerList;
