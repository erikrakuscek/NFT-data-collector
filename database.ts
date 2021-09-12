import sqlite3 from "sqlite3"

export function createDatabase() {
    var db = new sqlite3.Database('database.db');

    db.serialize(() => {

        db.run("CREATE TABLE Collection (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "address TEXT," +
            "block_number INTEGER," +
            "transaction_hash TEXT," +
            "name TEXT," +
            "symbol TEXT," +
            "site TEXT," +
            "image_url TEXT," +
            "description TEXT," +
            "external_link TEXT," +
            "facebook_url TEXT," +
            "twitter_url TEXT," +
            "opensea_link TEXT," +
            "discord_link TEXT," +
            "FOREIGN KEY(block_number) REFERENCES Block(id)" +
            ");");

        db.run("CREATE TABLE Block (" +
            "id INTEGER PRIMARY KEY," +
            "hash TEXT," +
            "timestamp DATETIME" +
            ");");

        db.run("CREATE TABLE Asset (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "collection_id INTEGER," +
            "token_id TEXT," +
            "uri TEXT," +
            "asset_metadata TEXT," +
            "image_url TEXT," +
            "name TEXT," +
            "external_link TEXT," +
            "traits TEXT," +
            "latest_transfer_id INTEGER," +
            "FOREIGN KEY(collection_id) REFERENCES Collection(id)," +
            "FOREIGN KEY(latest_transfer_id) REFERENCES Transfer(id)" +
            ");");

        db.run("CREATE TABLE Wallet (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "address TEXT" +
            ");");

        db.run("CREATE TABLE \"Transaction\" (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "hash TEXT," +
            "block_number INTEGER," +
            "transaction_index TEXT," +
            "from_wallet_id TEXT," +
            "to_wallet_id TEXT," +
            "nonce TEXT," +
            "gas REAL," +
            "gas_price REAL," +
            "value REAL," +
            "vol INTEGER," +
            "FOREIGN KEY(block_number) REFERENCES Block(id)," +
            "FOREIGN KEY(from_wallet_id) REFERENCES Wallet(id)," +
            "FOREIGN KEY(to_wallet_id) REFERENCES Wallet(id)" +
            ");");

        db.run("CREATE TABLE Transfer (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "block_number INTEGER," +
            "log_index TEXT," +
            "transaction_id INTEGER," +
            "token_id INTEGER," +
            "from_wallet_id TEXT," +
            "to_wallet_id TEXT," +
            "FOREIGN KEY(block_number) REFERENCES Block(id)," +
            "FOREIGN KEY(transaction_id) REFERENCES \"Transaction\"(id)," +
            "FOREIGN KEY(token_id) REFERENCES Asset(id)," +
            "FOREIGN KEY(from_wallet_id) REFERENCES Wallet(id)," +
            "FOREIGN KEY(to_wallet_id) REFERENCES Wallet(id)" +
            ");");
    });
    
    db.close();
}