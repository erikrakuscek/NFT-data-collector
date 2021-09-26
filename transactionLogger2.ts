import * as web3 from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "./utils/ids";
import { Context, KeyedAccountInfo } from "@solana/web3.js";
import * as bs58 from 'bs58';

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
    connectionWs.onProgramAccountChange(TOKEN_PROGRAM_ID, async (keyedAccountInfo: KeyedAccountInfo, context: Context) => {
        console.log(keyedAccountInfo.accountId.toString());
        console.log(keyedAccountInfo);
        
    }, "finalized", [{ memcmp: {
        bytes: 'jpXCZedGfVR',
        offset: 36
    }}]);
    //connectionHttp.getProgramAccounts(TOKEN_PROGRAM_ID).then(console.log)
})();