import * as web3 from "@solana/web3.js";
import { createDatabase, insert } from "./utils/postgresql";
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

// To generate SQLite database
// createDatabase();

(async () => {
    connectionWs.onLogs('all', async (logs, ctx) => {
        // for transactions without memo and a lot of text
        if (logs.logs.join(' ').includes('NFT sold')){
            console.log(logs.signature);

            const token: any = {};
            const collection: any = {};
            const block: any = {};
            const transaction: any = {};
            const wallet: any = {};
            await connectionHttp.getTransaction(logs.signature).then(async info => {
                if (info && info.meta) {
                    token.address = info.meta.postTokenBalances ? info.meta.postTokenBalances[0].mint : null;

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
                        block.blockTime = result?.blockTime;
                    }

                    const metadata = await getMetadata(token.address!)
                    token.name = metadata.data.name;
                    token.uri = metadata.data.uri;
                    //token.symbol = metadata.data.symbol;

                    const metadataJson = await getMetadataFromUrl(token.uri);
                    token.asset_metadata = JSON.stringify(metadataJson);
                    token.image_url = metadataJson.image;
                    token.traits = JSON.stringify(metadataJson.attributes);
                    //token.description = metadataJson.description;

                    collection.name = metadataJson.collection;
                    if (metadataJson.collection?.name) {
                        collection.name = metadataJson.collection.name;
                    }
                    collection.description = metadataJson.collection?.family;
                    collection.external_url = metadataJson.external_url;

                    const idxSeller = subArray.indexOf(Math.max(...subArray));
                    const idxBuyer = subArray.indexOf(Math.min(...subArray));
                    wallet.from_wallet_address = info.transaction.message.accountKeys[idxSeller].toString();
                    wallet.to_wallet_address = info.transaction.message.accountKeys[idxBuyer].toString();
                }
            }).catch(e => console.log(e));
            const wallet_from_id = await insert(`INSERT INTO Wallet (Address) VALUES ('${wallet.from_wallet_address}') RETURNING id;`);
            const wallet_to_id = await insert(`INSERT INTO Wallet (Address) VALUES ('${wallet.to_wallet_address}') RETURNING id;`);
            const block_id = await insert(`INSERT INTO Block (Hash) VALUES ('${block.hash}') RETURNING id;`);
            console.log(token);
            console.log(collection);
            console.log(block);
            console.log(transaction);
            console.log(wallet);
        }
    })
})();