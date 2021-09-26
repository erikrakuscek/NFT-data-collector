import * as web3 from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "./utils/ids";
import { Context, KeyedAccountInfo } from "@solana/web3.js";
import * as bs58 from "bs58";

// Connect to cluster
var connectionHttp = new web3.Connection(
    'http://api.mainnet-beta.solana.com',
    "confirmed"
);
var connectionWs = new web3.Connection(
    'ws://api.mainnet-beta.solana.com',
    "confirmed"
);

/*(async () => {
    connectionWs.onProgramAccountChange(TOKEN_PROGRAM_ID, async (keyedAccountInfo: KeyedAccountInfo, context: Context) => {
        console.log(keyedAccountInfo.accountId.toString());
        console.log(keyedAccountInfo);
        
    }, "finalized", [{ memcmp: {
        bytes: 'jpXCZedGfVR',
        offset: 36
    }}]);
    //connectionHttp.getProgramAccounts(TOKEN_PROGRAM_ID).then(console.log)
})();*/

(async () => {
    const signatures = await connectionHttp.getConfirmedSignaturesForAddress2(new web3.PublicKey('G9d16GtWv7sKCvoyig2TztyRGLFT1Wnt71yaXegUiPre'));
    //TODO processing only new transaction from latest block


    const signature = signatures[0].signature;
    console.log(signature);
    const transaction = await connectionHttp.getTransaction(signature);
    const accounts = transaction?.transaction.message.accountKeys;
    const instructions = transaction?.meta?.innerInstructions;
    
    if(instructions && accounts){
        for(const innerInstructions  of instructions){
            if(innerInstructions){
                for(const innerInstruction of innerInstructions.instructions){
                    if(accounts[innerInstruction.programIdIndex].toString() == TOKEN_PROGRAM_ID.toString()){
                        //console.log("interact with token programm", TOKEN_PROGRAM_ID.toString())
                        const data = bs58.decode(innerInstruction.data).toString('hex')
                        if(data.substring(0,2) == "03"){
                            console.log("Token Transfer")
                            //TODO decode transfer amount
                        }
                    }
                }
            }
        }
    }
    
})();