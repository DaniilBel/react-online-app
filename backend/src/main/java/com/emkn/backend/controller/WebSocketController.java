package com.emkn.backend.controller;

import com.emkn.backend.model.ChatMessage;
import com.emkn.backend.model.GameState;
import com.emkn.backend.model.Player;
import com.emkn.backend.model.UserDTO;
import com.emkn.backend.model.Vote;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Controller
public class WebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketController.class);

    private final SimpMessagingTemplate messagingTemplate;
    private List<UserDTO> onlineUsers = new CopyOnWriteArrayList<>();
    private Map<String, String> votes = new HashMap<>();
    private ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private long remainingTime = 5; // in seconds

    private GameState gameState;

    @Autowired
    public WebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;

        // Инициализация игрового состояния
        String[] template = {
                "**************",
                "*________*W__*",
                "*__L_W___*W__*",
                "*__*E**__*_*_E",
                "*__*__*__*_*L*",
                "*__****__*_*L*",
                "*____________*",
                "*________*___*",
                "*____P___*****",
                "**************"
        };
        Player player = new Player(5, 8, 3); // начальная позиция игрока и здоровье
        this.gameState = new GameState(template, player);


        scheduler.scheduleAtFixedRate(this::processVotes, 1, 5, TimeUnit.SECONDS);
        scheduler.scheduleAtFixedRate(this::updateRemainingTime, 1, 1, TimeUnit.SECONDS);
    }

    @MessageMapping("/ping")
    @SendTo("/topic/onlineUsers")
    public List<UserDTO> ping(UserDTO user) {
        boolean userExists = onlineUsers.stream().anyMatch(u -> u.getNickname().equals(user.getNickname()));

        if (!userExists) {
            onlineUsers.add(user);
        }

        return onlineUsers;
    }

    @MessageMapping("/disconnect")
    @SendTo("/topic/onlineUsers")
    public List<UserDTO> disconnect(UserDTO user) {
        onlineUsers.removeIf(u -> u.getNickname().equals(user.getNickname()));
        return onlineUsers;
    }

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public ChatMessage sendMessage(ChatMessage message) {
        return message;
    }

    @MessageMapping("/vote")
    public void vote(Vote vote) {
        votes.put(vote.getUsername(), vote.getDirection());
        sendVotesUpdate();
    }

    @MessageMapping("/timer")
    public void sendRemainingTime() {
        logger.info("Sending remaining time: " + remainingTime + " seconds");
        messagingTemplate.convertAndSend("/topic/timer", remainingTime);
    }

    @MessageMapping("/gameState")
    public void sendGameState() {
        messagingTemplate.convertAndSend("/topic/gameState", gameState);
    }

    private Map<String, Integer> countVotes() {
        Map<String, Integer> voteCounts = new HashMap<>();
        votes.values().forEach(direction -> voteCounts.put(direction, voteCounts.getOrDefault(direction, 0) + 1));
        return voteCounts;
    }

    private void processVotes() {
        Map<String, Integer> voteCounts = countVotes();
        String chosenDirection = voteCounts.entrySet().stream()
                .max(Comparator.comparingInt(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElse("none");

        ChatMessage systemMessage = new ChatMessage();
        // systemMessage.setSender("system");
        // systemMessage.setContent("Выбрана кнопка: " + (chosenDirection.equals("none") ? "никакая" : chosenDirection));
        logger.info(systemMessage.getContent());
        //sendSystemMessage(systemMessage);

        if (!chosenDirection.equals("none")) {
            gameState.movePlayer(chosenDirection);
            gameState.logField(); // логирование текущего состояния поля
            if(gameState.checkFinish()) {
                systemMessage.setSender("system");
                systemMessage.setContent("Вы дошли до финиша");
                sendSystemMessage(systemMessage);
                gameState.resetPosition();
            }
            messagingTemplate.convertAndSend("/topic/gameState", gameState);
        }

        votes.clear();
        sendVotesUpdate(); // Send an update to reset vote counts on the client
        remainingTime = 5;
    }

    private void sendSystemMessage(ChatMessage message) {
        logger.info("Sending system message: " + message.getContent());
        messagingTemplate.convertAndSend("/topic/messages", message);
    }

    private void sendVotesUpdate() {
        Map<String, Integer> voteCounts = countVotes();
        messagingTemplate.convertAndSend("/topic/votes", voteCounts);
    }

    private void updateRemainingTime() {
        if (remainingTime > 0) {
            remainingTime--;
            sendRemainingTime();
        }
    }
}
