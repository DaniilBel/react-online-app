import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import grass from '../assets/grass.png';
import bush from '../assets/bush.png';
import player_ from '../assets/player.png';
import water from '../assets/water.png';
import lava from '../assets/lava.jpg';
import exit from '../assets/exit.png';

const TILE_SIZE = 32; // размер клетки в пикселях
const COLORS = {
    '*': bush,    // стены
    '_': grass,   // пол
    'L': lava,  // лава
    'W': water,    // вода
    'P': grass,    // игрок
    'E': exit
};

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    });
}

const Canvas = () => {
    const [gameState, setGameState] = useState(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws');
        // const socket = new SockJS('https://bba8mn43mvel1jncd95g.containers.yandexcloud.net/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WebSocket server');
                stompClient.subscribe('/topic/gameState', (message) => {
                    const gameState = JSON.parse(message.body);
                    console.log('Received game state:', gameState);
                    logGameState(gameState); // Логирование состояния игры
                    setGameState(gameState);
                });
                // Запрос начального состояния игры
                stompClient.publish({ destination: '/app/gameState' });
            },
        });

        stompClient.activate();

        return () => {
            stompClient.deactivate();
        };
    }, []);

    useEffect(() => {
        if (gameState) {
            drawGameState();
        }
    }, [gameState]);

    const logGameState = (gameState) => {
        console.log('Current game state:');
        if (Array.isArray(gameState.field)) {
            gameState.field.forEach((row, y) => {
                if (typeof row === 'string') {
                    console.log(row); // Логирование строки
                } else if (Array.isArray(row)) {
                    console.log(row.join(''));
                } else {
                    console.error(`Invalid row format at index ${y}:`, row);
                }
            });
            console.log(`Player Health: ${gameState.player.health}`);
        } else {
            console.error('Invalid game state field format:', gameState.field);
        }
    };

    const drawGameState = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Очистка канваса
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Проверка, что gameState.field является массивом
        if (Array.isArray(gameState.field)) {
            const imagePromises = [];
            // Отрисовка игрового поля
            gameState.field.forEach((row, y) => {
                if (typeof row === 'string') {
                    row = row.split(''); // Преобразование строки в массив символов
                }

                if (Array.isArray(row)) {
                    

                    row.forEach((tile, x) => {
                        // ctx.fillStyle = COLORS[tile] || 'gray';
                        // ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                        if (COLORS[tile]) {
                            imagePromises.push(loadImage(COLORS[tile]).then(img => ({
                                img,
                                x: x * TILE_SIZE,
                                y: y * TILE_SIZE
                            })));
                        }
                    });
                } else {
                    console.error(`Invalid row format at index ${y}:`, row);
                }
            });

            // Отрисовка игрока
            const player_img = gameState.player;
            const playerPromise = loadImage(player_).then(img => ({
                img,
                x: player_img.x * TILE_SIZE,
                y: player_img.y * TILE_SIZE
            }));

            // Ожидание загрузки всех изображений и их отрисовка
            Promise.all([...imagePromises, playerPromise]).then(images => {
                images.forEach(({ img, x, y }) => {
                    ctx.drawImage(img, x, y);
                });

                // Отрисовка здоровья игрока
                ctx.fillStyle = 'white';
                ctx.font = '16px Arial';
                ctx.fillText(`Health: ${player_img.health}`, 10, canvas.height - 10);
            }).catch(err => {
                console.error('Error loading images:', err);
            });

            // Отрисовка здоровья игрока
            // ctx.fillStyle = 'white';
            // ctx.font = '16px Arial';
            // ctx.fillText(`Health: ${player.health}`, 10, canvas.height - 10);
        } else {
            console.error('Invalid game state field format:', gameState.field);
        }
    };

    return (
        <div>
            <canvas ref={canvasRef} width={450} height={360} />
        </div>
    );
};

export default Canvas;
