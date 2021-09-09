import web3 from "@solana/web3.js"
import sqlite3 from "sqlite3"

const connectionHttp = new web3.Connection(
    'http://api.mainnet-beta.solana.com'
);

const connectionWs = new web3.Connection(
    'ws://api.mainnet-beta.solana.com'
);

var db = new sqlite3.Database('database.db');

db.serialize(() => {
    db.run("CREATE TABLE Collections (" +
        "collection_id TEXT PRIMARY KEY," +
        "name TEXT," +
        ")");

    db.run("CREATE TABLE NFT_info (" +
        "token_id TEXT PRIMARY KEY," +
        "collection_id TEXT," +
        "name TEXT," +
        "symbol TEXT," +
        "description TEXT," +
        "img_url TEXT" +
        "FOREIGN KEY(collection_id) REFERENCES Collections(collection_id) TEXT," +
        ")");

    db.run("CREATE TABLE Transactions (" +
        "signature TEXT PRIMARY KEY," +
        "token_id TEXT" +
        "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP," +
        "price REAL," +
        "amount INTEGER" +
        "FOREIGN KEY(token_id) REFERENCES NFT_info(token_id) TEXT," +
        ")");

});

db.close();

/*connectionWs.onLogs('all', (logs, ctx) => {
    if (logs.logs.join(' ').includes('NFT')){
        console.log(logs);
    }
})*/

/*connectionHttp.getTransaction('22KDDVLjUu6BXmBMy1VXwbn7i2g2tjaopWtw6JVvVdZ9HaLr7762eu77kqFGc7LvTz1v66tMUMR1xFnodTfXyCGu').then(balance => {
    console.log(balance)
    console.log(balance.meta.postTokenBalances)
    console.log(balance.meta.preTokenBalances)
}).catch(e => console.log(e))*/

connectionHttp.getParsedAccountInfo(new web3.PublicKey('23BkLv9wRfvuBj3Mtm6kXZkMXQB2dezDvnhVP7WRXCff')).then(info => {
    console.log("info")
    console.log(info)
    console.log(info.value.data.parsed)
}).catch(e => console.log(e))
