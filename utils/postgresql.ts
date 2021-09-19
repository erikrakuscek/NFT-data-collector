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

export async function createDatabase() {
    await client.query("CREATE TABLE IF NOT EXISTS public.Block (" +
        "id SERIAL PRIMARY KEY," +
        "hash TEXT," +
        "timestamp TIMESTAMP DEFAULT NOW()" +
        ");");

    await client.query("CREATE TABLE IF NOT EXISTS public.Wallet (" +
        "id SERIAL PRIMARY KEY," +
        "address TEXT" +
        ");");

    await client.query("CREATE TABLE IF NOT EXISTS public.Collection (" +
        "id SERIAL PRIMARY KEY," +
        "address TEXT," +
        "block_number INT," +
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
        "discord_link TEXT" +
        ");");

    await client.query("CREATE TABLE IF NOT EXISTS public.Token (" +
        "id SERIAL PRIMARY KEY," +
        "collection_id INT," +
        "address TEXT," +
        "uri TEXT," +
        "asset_metadata TEXT," +
        "image_url TEXT," +
        "name TEXT," +
        "external_link TEXT," +
        "traits TEXT," +
        "latest_transfer_id INT" +
        ");");

    await client.query("CREATE TABLE IF NOT EXISTS public.Transaction (" +
        "id SERIAL PRIMARY KEY," +
        "hash TEXT," +
        "block_number INT," +
        "transaction_index TEXT," +
        "from_wallet_id TEXT," +
        "to_wallet_id TEXT," +
        "recentBlockHash TEXT," +
        "fee INT," +
        "value REAL," +
        "vol INT" +
        ");");

    await client.query("CREATE TABLE IF NOT EXISTS public.Transfer (" +
        "id SERIAL PRIMARY KEY," +
        "block_number INT," +
        "log_index TEXT," +
        "transaction_id INT," +
        "token_id INT," +
        "from_wallet_id TEXT," +
        "to_wallet_id TEXT" +
        ");");
}