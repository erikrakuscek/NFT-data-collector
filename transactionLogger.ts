import * as web3 from "@solana/web3.js";
import { createDatabase } from "./utils/database";
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
                    token.token_id = info.meta.postTokenBalances ? info.meta.postTokenBalances[0].mint : null;

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

                    const metadata = await getMetadata(token.token_id!)
                    token.name = metadata.data.name;
                    token.uri = metadata.data.uri;
                    //token.symbol = metadata.data.symbol;

                    token.asset_metadata = await getMetadataFromUrl(token.uri);
                    token.image_url = token.asset_metadata.image;
                    token.traits = token.asset_metadata.attributes;
                    //token.description = token.asset_metadata.description;

                    collection.name = token.asset_metadata.collection;
                    if (token.asset_metadata.collection?.name) {
                        collection.name = token.asset_metadata.collection.name;
                    }
                    collection.description = token.asset_metadata.collection?.family;
                    collection.external_url = token.asset_metadata.external_url;

                    const idxSeller = subArray.indexOf(Math.max(...subArray));
                    const idxBuyer = subArray.indexOf(Math.min(...subArray));
                    wallet.from_wallet_address = info.transaction.message.accountKeys[idxSeller].toString();
                    wallet.to_wallet_address = info.transaction.message.accountKeys[idxBuyer].toString();
                }
            }).catch(e => console.log(e));
            console.log(token);
            console.log(collection);
            console.log(block);
            console.log(transaction);
            console.log(wallet);
        }
    })
})();

// To generate SQLite database
// createDatabase();