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
            await connectionHttp.getTransaction(logs.signature).then(async info => {
                //console.log(info);
                if (info && info.meta) {
                    token.token_id = info.meta.postTokenBalances ? info.meta.postTokenBalances[0].mint : null;

                    const preBalances = info.meta.preBalances;
                    const postBalances = info.meta.postBalances;
                    token.value = Math.max(...preBalances.map((item, index) => item - postBalances[index]))/1000000000;
            
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
        }
    })
})();

// To generate SQLite database
// createDatabase();