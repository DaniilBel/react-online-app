package com.emkn.backend.datastore;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.util.Properties;

public abstract class DataStore {

    private Connection connection;

    public Connection getConnection() {
        return connection;
    }

    public void createConnection(String url) {
        String DB_URL     = url;
        String DB_USER    = "user1";
        String DB_PASS    = "12345678";

        try {
//            Properties props = new Properties();
//            props.setProperty("user", "postgres");
//            props.setProperty("password", "1234");

//            props.setProperty("host", "c-c9qj1toftv8jt0mq48b6.rw.mdb.yandexcloud.net");
//            props.setProperty("port", "6432");
//            props.setProperty("sslmode", "verify-full");
//            props.setProperty("dbname", "postgresql-game");
//            props.setProperty("user", "user1");
//            props.setProperty("password", "12345678");
//            props.setProperty("target_session_attrs", "read-write");
//            connection = DriverManager.getConnection(url, props);

//            Class.forName("org.postgresql.Driver");

            connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
            ResultSet q = connection.createStatement().executeQuery("SELECT version()");
            if(q.next()) {System.out.println(q.getString(1));}

//            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    static DataStore createDataStore() {
        return null;
    }
}

