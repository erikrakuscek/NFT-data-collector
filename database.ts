import sqlite3 from "sqlite3"

export function createDatabase() {
    var db = new sqlite3.Database('database.db');

    db.serialize(() => {

        db.run("CREATE TABLE Collections (" +
            "collection_id TEXT PRIMARY KEY," +
            "name TEXT" +
            ");");

        db.run("CREATE TABLE NFT_info (" +
            "token_id TEXT PRIMARY KEY," +
            "collection_id TEXT," +
            "name TEXT," +
            "symbol TEXT," +
            "description TEXT," +
            "img_url TEXT," +
            "FOREIGN KEY(collection_id) REFERENCES Collections(collection_id)" +
            ");");

        db.run("CREATE TABLE Transactions (" +
            "signature TEXT PRIMARY KEY," +
            "token_id TEXT," +
            "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP," +
            "price REAL," +
            "amount INTEGER," +
            "FOREIGN KEY(token_id) REFERENCES NFT_info(token_id)" +
            ");");
    });
    
    db.close();
}