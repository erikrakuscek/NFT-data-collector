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
    connectionWs.onLogs('all', (logs, ctx) => {
        // for transactions without memo and a lot of text
        if (logs.logs.join(' ').includes('NFT sold')){
            connectionHttp.getTransaction(logs.signature).then(async info => {
                console.log(info);
                if (info && info.meta) {
                    const preBalances = info.meta.preBalances;
                    const postBalances = info.meta.postBalances;
                    const preTokenBalances = info.meta.preTokenBalances;
                    const postTokenBalances = info.meta.postTokenBalances;
                    const price = Math.max(...preBalances.map((item, index) => item - postBalances[index]))/1000000000;
                    const tokenId = info.meta.postTokenBalances ? info.meta.postTokenBalances[0].mint : null;
            
                    console.log(price);
                    console.log(tokenId);
            
                    const metadata = await getMetadata(tokenId!)
                    const tokenName = metadata.data.name;
                    const tokenUri = metadata.data.uri;
                    console.log(tokenName);
                    console.log(tokenUri);
        
                    const metadataJson = await getMetadataFromUrl(tokenUri);
                    console.log(metadataJson);
                }
            }).catch(e => console.log(e));            
        }
    })
})();

// To generate SQLite database
// createDatabase();