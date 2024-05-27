package com.emkn.backend.model;

public class GameState {
    private char[][] field;
    private Player player;

    public GameState(String[] template, Player player) {
        this.field = new char[template.length][template[0].length()];
        for (int i = 0; i < template.length; i++) {
            for (int j = 0; j < template[i].length(); j++) {
                this.field[i][j] = template[i].charAt(j);
            }
        }
        this.player = player;
    }

    public char[][] getField() {
        return field;
    }

    public Player getPlayer() {
        return player;
    }

    public void resetPosition() {
        player.setX(5);
        player.setY(8);
        player.setHealth(3);
    }

    public boolean checkFinish() {
        int newX = player.getX();
        int newY = player.getY();
        char newPosition = field[newY][newX];

        return newPosition == 'E';
    }

    public void movePlayer(String direction) {
        int newX = player.getX();
        int newY = player.getY();

        switch (direction) {
            case "up":
                newY--;
                break;
            case "down":
                newY++;
                break;
            case "left":
                newX--;
                break;
            case "right":
                newX++;
                break;
        }

        if (newX >= 0 && newX < field[0].length && newY >= 0 && newY < field.length) {
            char newPosition = field[newY][newX];
            if (newPosition != '*') {
                player.setX(newX);
                player.setY(newY);
                if (newPosition == 'L' || newPosition == 'W') {
                    player.setHealth(player.getHealth() - 1);
                }
            }
        }
    }

    public void logField() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < field.length; i++) {
            for (int j = 0; j < field[i].length; j++) {
                if (i == player.getY() && j == player.getX()) {
                    sb.append('P');
                } else {
                    sb.append(field[i][j]);
                }
            }
            sb.append('\n');
        }
        sb.append("Player Health: ").append(player.getHealth()).append('\n');
        System.out.println(sb.toString());
    }
}
