import * as web3 from "@solana/web3.js";
import { createDatabase, insert, select, update } from "./utils/postgresql";
import { getMetadata, getMetadataFromUrl } from "./utils/metadata";

// Connect to cluster
var connectionHttp = new web3.Connection(
    'http://api.mainnet-beta.solana.com',
    "confirmed"
);
var connectionWs = new web3.Connection(
    'ws://api.mainnet-beta.solana.com',
    "confirmed"
);

// Generate tables in postgresql if they don't exist
createDatabase();

(async () => {
    connectionWs.onLogs('all', async (logs, ctx) => {
        // for transactions without memo and a lot of text
        if (logs.logs.join(' ').includes('NFT sold')){
            console.log(logs.signature);

            await connectionHttp.getTransaction(logs.signature).then(async info => {    
                if (info && info.meta) {
                    const token: any = {};
                    const collection: any = {};
                    const block: any = {};
                    const transaction: any = {};
                    const wallet: any = {};
                    const transfer: any = {};
    
                    token.address = info.meta.postTokenBalances ? info.meta.postTokenBalances[0].mint : null;
                    transfer.log = replaceApostrophe(JSON.stringify(logs.logs));

                    const preBalances = info.meta.preBalances;
                    const postBalances = info.meta.postBalances;
                    const subArray = preBalances.map((item, index) => postBalances[index] - item);
                    transaction.value = Math.abs(Math.min(...subArray)/1000000000);
                    transaction.signature = logs.signature;
                    transaction.recent_blockhash = info.transaction.message.recentBlockhash;
                    transaction.fee = info.meta.fee;
                    transaction.vol = 1;
                    
                    var slotNumber = info?.slot;
                    if (slotNumber) {
                        const result = await connectionHttp.getBlock(slotNumber);
                        block.hash = result?.blockhash;
                        block.block_time = result?.blockTime;
                    }

                    const metadata = await getMetadata(token.address!)
                    token.name = replaceApostrophe(metadata.data.name);
                    token.uri = replaceApostrophe(metadata.data.uri);
                    token.symbol = replaceApostrophe(metadata.data.symbol);

                    const metadataJson = await getMetadataFromUrl(token.uri);
                    token.asset_metadata = replaceApostrophe(JSON.stringify(metadataJson));
                    token.image_url = replaceApostrophe(metadataJson.image);
                    token.traits = replaceApostrophe(JSON.stringify(metadataJson.attributes));
                    token.description = replaceApostrophe(metadataJson.description);

                    if (metadataJson.collection?.name) {
                        collection.name = replaceApostrophe(metadataJson.collection.name);
                    } else {
                        collection.name = replaceApostrophe(metadataJson.collection);
                    }
                    collection.family = replaceApostrophe(metadataJson.collection?.family);
                    if (metadataJson.external_url) {
                        collection.external_url = replaceApostrophe((new URL(metadataJson.external_url)).origin);    
                    } else {
                        collection.external_url = '';
                    }

                    const idxSeller = subArray.indexOf(Math.max(...subArray));
                    const idxBuyer = subArray.indexOf(Math.min(...subArray));
                    wallet.from_wallet_address = info.transaction.message.accountKeys[idxSeller].toString();
                    wallet.to_wallet_address = info.transaction.message.accountKeys[idxBuyer].toString();

                    const from_wallet_id = await insert(`INSERT INTO Wallet (address) VALUES ('${wallet.from_wallet_address}') ON CONFLICT (address) DO UPDATE SET address = Wallet.address RETURNING id;`);
                    const to_wallet_id = await insert(`INSERT INTO Wallet (address) VALUES ('${wallet.to_wallet_address}') ON CONFLICT (address) DO UPDATE SET address = Wallet.address RETURNING id;`);
        
                    const block_id = await insert(`INSERT INTO Block (hash, block_time) VALUES ('${block.hash}', ${block.block_time}) RETURNING id;`);
        
                    let collection_id = await select(`SELECT id FROM Collection WHERE name = '${collection.name}' AND family = '${collection.family}' AND external_url = '${collection.external_url}';`);
                    if (!(collection_id[0] && collection_id[0].id)) {
                        collection_id = await insert(`INSERT INTO Collection (name, family, external_url) VALUES ('${collection.name}','${collection.family}','${collection.external_url}') RETURNING id;`);
                    } else {
                        collection_id = collection_id[0].id;
                    }
                    
                    const token_id = await insert(`INSERT INTO Token (collection_id, address, uri, asset_metadata, image_url, name, symbol, description, traits) VALUES (${collection_id},'${token.address}','${token.uri}','${token.asset_metadata}','${token.image_url}','${token.name}','${token.symbol}','${token.description}','${token.traits}') ON CONFLICT (address) DO UPDATE SET name = Token.name RETURNING id;`);
        
                    const transaction_id = await insert(`INSERT INTO Transaction (signature, block_id, from_wallet_id, to_wallet_id, recent_blockHash, fee, value, vol) VALUES ('${transaction.signature}',${block_id},${from_wallet_id},${to_wallet_id},'${transaction.recent_blockhash}',${transaction.fee},${transaction.value},${transaction.vol}) RETURNING id;`);
        
                    const transfer_id = await insert(`INSERT INTO Transfer (block_id, log, transaction_id, token_id, from_wallet_id, to_wallet_id) VALUES (${block_id},'${transfer.log}',${transaction_id},${token_id},${from_wallet_id},${to_wallet_id}) RETURNING id;`);
                    
                    await update(`UPDATE Token SET latest_transfer_id = ${transfer_id} WHERE id = ${token_id};`);
            
                    //console.log(wallet);
                    //console.log(block);
                    //console.log(collection);
                    //console.log(token);
                    //console.log(transaction);
                    //console.log(transfer);

                    if (!transaction) {
                        console.error(`get failed for transaction: ${logs.signature}`);
                    }        
                }
            }).catch(e => console.error(e));
        }
    })
})();

function replaceApostrophe(str: string) {
    return str ? str.replace(/'/g, '\'\'') : '';
}