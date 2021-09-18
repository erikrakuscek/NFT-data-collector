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
            const token: any = {};
            const collection: any = {};
            const block: any = {};
            const transaction: any = {};
            await connectionHttp.getTransaction(logs.signature).then(async info => {
                console.log(info);
                console.log("postTokenbalance ",info?.meta?.postTokenBalances);
                console.log("transMessage ",info?.transaction.message);
                console.log("transInstraction ",info?.transaction.message.instructions);
                if (info && info.meta) {
                    token.token_id = info.meta.postTokenBalances ? info.meta.postTokenBalances[0].mint : null;

                    const preBalances = info.meta.preBalances;
                    const postBalances = info.meta.postBalances;
                    token.value = Math.max(...preBalances.map((item, index) => item - postBalances[index]))/1000000000;
                    
                    var slotNumber = info?.slot
                    if (slotNumber != null){
                        connectionHttp.getBlock(slotNumber).then(async result => { 
                            block.hash = result?.blockhash;
                            block.blockTime = result?.blockTime;
                            console.log("block time:", result?.blockTime, "; block hash:", result?.blockhash)
                        })}


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
                }
            }).catch(e => console.log(e));
            console.log(token);
            console.log(collection);
            console.log(block);
            
        }
    })
})();

// To generate SQLite database
// createDatabase();