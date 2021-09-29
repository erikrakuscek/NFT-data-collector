import { Connection, PublicKey, Context, KeyedAccountInfo } from "@solana/web3.js";
import { getMetadata, getMetadataFromUrl } from "./utils/metadata";
import { TOKEN_PROGRAM_ID, SYSTEM } from "./utils/ids";
import {  interval } from 'rxjs';
import * as bs58 from "bs58";

// Connect to cluster
var connectionHttp = new Connection(
    'http://api.mainnet-beta.solana.com',
    "confirmed"
);
var connectionWs = new Connection(
    'ws://api.mainnet-beta.solana.com',
    "confirmed"
);

let processing: boolean = false;
let queue: any[] = [];
interval(100).subscribe(async () => {
    const element = queue.shift();
    const tokenAddress = element ? element.tokenAddress : '';
    const slot = element ? element.slot : 0;
    console.log("queue elements: ", queue.length, "  address: ", tokenAddress ? tokenAddress : '');
    if (queue.length === 0 || processing) {
        return;
    }
    processing = true;


    // Get signatures of transactions regarding a token
    const signatures = await connectionHttp.getConfirmedSignaturesForAddress2(new PublicKey(tokenAddress));

    // Filter out only transactions that happened less than 50 slot ago
    if (signatures.length > 0 && slot - signatures[0].slot > 50) {
        processing = false;
        return;
    }

    const token: any = {};
    const collection: any = {};
    const block: any = {};
    const transaction: any = {};
    const wallet: any = {};
    const transfer: any = {};

    token.address = tokenAddress;
    transaction.signature = signatures[0].signature;
    const transactionData = await connectionHttp.getTransaction(transaction.signature);
    transaction.recent_blockhash = transactionData?.transaction.message.recentBlockhash;
    transaction.fee = transactionData?.meta?.fee;
    transfer.log = replaceApostrophe(JSON.stringify(transactionData?.meta?.logMessages));

    const accounts = transactionData?.transaction.message.accountKeys;
    const instructions = transactionData?.meta?.innerInstructions;
    let lastSolTransfer = null;
    let isTokenTransfer = false;
    if (instructions && accounts) {
        for (const innerInstructions of instructions) {
            if (innerInstructions.instructions) {
                for (const innerInstruction of innerInstructions.instructions) {
                    if (accounts[innerInstruction.programIdIndex].equals(TOKEN_PROGRAM_ID)) {
                        const data = bs58.decode(innerInstruction.data).toString('hex');
                        if (data.substring(0,2) === "03" && lastSolTransfer) {
                            const price = bs58.decode(lastSolTransfer.data).toString('hex');
                            transaction.value = hexToDecimalLittleEndian(price.substring(8))/1000000000;
                            transaction.vol = hexToDecimalLittleEndian(data.substring(2));

                            wallet.from_wallet_address = accounts[innerInstruction.accounts[0]].toString();
                            wallet.to_wallet_address = accounts[innerInstruction.accounts[1]].toString();
        
                            isTokenTransfer = true;
                            //TODO: to_wallet_address is a token account, fix if we need to store the owner of this token account instead
                        }
                    } else if (accounts[innerInstruction.programIdIndex].equals(SYSTEM)) {
                        lastSolTransfer = innerInstruction;
                    }
                }
            }
        }
    }

    // Transaction is not a token transfer so no need to process further
    if (!isTokenTransfer) {
        processing = false;
        return;
    }

    var slotNumber = transactionData?.slot;
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

    console.log("token transfer finished", token.address);
    processing = false;

    /*console.log(wallet);
    console.log(block);
    console.log(collection);
    console.log(token);
    console.log(transaction);
    console.log(transfer);*/
});

(async () => {
    connectionWs.onProgramAccountChange(TOKEN_PROGRAM_ID, async (keyedAccountInfo: KeyedAccountInfo, context: Context) => {
        // Add to the processing queue
        queue.push({ tokenAddress: keyedAccountInfo.accountId.toString(), slot: context.slot});

    }, "finalized", [{ memcmp: {
        bytes: 'jpXCZedGfVR',
        offset: 36
    }}]);
})();

function replaceApostrophe(str: string) {
    return str ? str.replace(/'/g, '\'\'') : '';
}

function hexToDecimalLittleEndian(endian: string) {
    return parseInt('0x' + endian.match(/../g)?.reverse().join(''));
}