package com.emkn.backend.repository;

import com.emkn.backend.datastore.DataStore;
import com.emkn.backend.datastore.SQLDataStore;
import com.emkn.backend.model.UserDTO;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class SQLUserRepository implements UserRepository {

    private DataStore dataStore;

    public SQLUserRepository() {
//        dataStore = SQLDataStore.createDataStore("jdbc:sqlite:database.sqlite");
//        dataStore = SQLDataStore.createDataStore("jdbc:postgresql://localhost:5432/RPG2d");
        dataStore = SQLDataStore.createDataStore("""
                jdbc:postgresql://rc1d-5r0y2xa7guqfhsdw.mdb.yandexcloud.net:6432,
                rc1d-5r0y2xa7guqfhsdw.mdb.yandexcloud.net:6432/db1?
                targetServerType=master&ssl=true&sslmode=verify-full&target_session_attrs=read-write""");
    }

    public SQLUserRepository(SQLDataStore dataStore) {
        this.dataStore = dataStore;
    }

    @Override
    public List<UserDTO> getAll() {
        try {
            String query = "SELECT * FROM \"Player\"";
            Statement statement = dataStore.getConnection().createStatement();
            ResultSet resultSet = statement.executeQuery(query);
            List<UserDTO> output = parseResultSet(resultSet);
            resultSet.close();
            statement.close();
            return output;
        } catch (Exception e) {
            e.printStackTrace();
        }

        return new ArrayList<>();
    }

    @Override
    public UserDTO getByID(int id) {
        try {
            String query = "SELECT * FROM \"Player\" WHERE id = ?";
            PreparedStatement statement = dataStore.getConnection().prepareStatement(query);
            statement.setInt(1, id);
            ResultSet resultSet = statement.executeQuery();
            List<UserDTO> output = parseResultSet(resultSet);
            resultSet.close();
            statement.close();
            if (!output.isEmpty()) {
                return output.get(0);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    @Override
    public int addUser(UserDTO userDTO) {
        try {
            String query = "INSERT INTO \"Player\" (id, nickname, email, password) VALUES (?,?,?,?)";
            PreparedStatement statement = dataStore.getConnection().prepareStatement(query, Statement.RETURN_GENERATED_KEYS);
            statement.setInt(1, userDTO.getId());
            statement.setString(2, userDTO.getNickname());
            statement.setString(3, userDTO.getEmail());
            statement.setString(4, userDTO.getPassword());
            int affectedRows = statement.executeUpdate();

            if (affectedRows > 0) {
                ResultSet generatedKeys = statement.getGeneratedKeys();
                if (generatedKeys.next()) {
                    int id = generatedKeys.getInt(1);
                    generatedKeys.close();
                    statement.close();
                    return id;
                }
                generatedKeys.close();
            }
            statement.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
    }

    @Override
    public boolean deleteByID(int id) {
        try {
            String query = "DELETE FROM \"Player\" WHERE id = ?";
            PreparedStatement statement = dataStore.getConnection().prepareStatement(query);
            statement.setInt(1, id);
            int affectedRows = statement.executeUpdate();
            statement.close();
            return affectedRows > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public UserDTO authenticate(String username, String password) {
        try {
            String query = "SELECT * FROM \"Player\" WHERE nickname = ? AND password = ?";
            PreparedStatement statement = dataStore.getConnection().prepareStatement(query);
            statement.setString(1, username);
            statement.setString(2, password);
            ResultSet resultSet = statement.executeQuery();
            List<UserDTO> output = parseResultSet(resultSet);
            resultSet.close();
            statement.close();
            if (!output.isEmpty()) {
                return output.get(0);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    private List<UserDTO> parseResultSet(ResultSet resultSet) {
        List<UserDTO> output = new ArrayList<>();
        try {
            while (resultSet.next()) {
                UserDTO userDTO = new UserDTO();
                userDTO.setId(resultSet.getInt("id"));
                userDTO.setNickname(resultSet.getString("nickname"));
                userDTO.setEmail(resultSet.getString("email"));
                userDTO.setPassword(resultSet.getString("password")); // Ensure password is included
                output.add(userDTO);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return output;
    }
}
