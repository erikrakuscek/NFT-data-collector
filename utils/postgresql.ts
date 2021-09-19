import { Client } from 'pg';
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    password: 'wuboteam',
    port: 5432
});
client.connect();

export async function insert(query: string) {
    const result = await client.query(query);
    return result.rows[0].id;
}

export async function update(query: string) {
    await client.query(query);
}

export async function select(query: string){
    const result = await client.query(query);
    return result.rows;
}

export async function createDatabase() {
    await client.query("CREATE TABLE IF NOT EXISTS Wallet (" +
    "id SERIAL PRIMARY KEY," +
    "address TEXT UNIQUE" +
    ");");

    await client.query("CREATE TABLE IF NOT EXISTS Block (" +
        "id SERIAL PRIMARY KEY," +
        "hash TEXT," +
        "timestamp TIMESTAMP DEFAULT NOW()," +
        "block_time INT" +
        ");");

    await client.query("CREATE TABLE IF NOT EXISTS Collection (" +
        "id SERIAL PRIMARY KEY," +
        "name TEXT," +
        "symbol TEXT," +
        "family TEXT," +
        "external_url TEXT," +
        "image_url TEXT," +
        "facebook_url TEXT," +
        "twitter_url TEXT," +
        "opensea_link TEXT," +
        "discord_link TEXT" +
        ");");

    await client.query("CREATE TABLE IF NOT EXISTS Token (" +
        "id SERIAL PRIMARY KEY," +
        "collection_id INT," +
        "address TEXT UNIQUE," +
        "uri TEXT," +
        "asset_metadata TEXT," +
        "image_url TEXT," +
        "name TEXT," +
        "symbol TEXT," +
        "description TEXT," +
        "traits TEXT," +
        "latest_transfer_id INT" +
        ");");

    await client.query("CREATE TABLE IF NOT EXISTS Transaction (" +
        "id SERIAL PRIMARY KEY," +
        "signature TEXT," +
        "block_id INT," +
        "from_wallet_id INT," +
        "to_wallet_id INT," +
        "recent_blockhash TEXT," +
        "fee INT," +
        "value REAL," +
        "vol INT" +
        ");");

    await client.query("CREATE TABLE IF NOT EXISTS Transfer (" +
        "id SERIAL PRIMARY KEY," +
        "block_id INT," +
        "log TEXT," +
        "transaction_id INT," +
        "token_id INT," +
        "from_wallet_id INT," +
        "to_wallet_id INT" +
        ");");
}