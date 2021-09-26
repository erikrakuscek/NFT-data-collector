import { Connection, PublicKey, Context, KeyedAccountInfo } from "@solana/web3.js";
import { getMetadata, getMetadataFromUrl } from "./utils/metadata";
import { TOKEN_PROGRAM_ID, SYSTEM } from "./utils/ids";
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

(async () => {
    connectionWs.onProgramAccountChange(TOKEN_PROGRAM_ID, async (keyedAccountInfo: KeyedAccountInfo, context: Context) => {
        const token: any = {};
        const collection: any = {};
        const block: any = {};
        const transaction: any = {};
        const wallet: any = {};
        const transfer: any = {};

        token.address = keyedAccountInfo.accountId.toString();

        const signatures = await connectionHttp.getConfirmedSignaturesForAddress2(new PublicKey(token.address));
        //TODO: Set up a filter to process only relevant (latest?) transactions
        //TODO: Right now too many requests. Maybe create a queue to process transactions asynchronous

        transaction.signature = signatures[0].signature;
        const transactionData = await connectionHttp.getTransaction(transaction.signature);
        transaction.recent_blockhash = transactionData?.transaction.message.recentBlockhash;
        transaction.fee = transactionData?.meta?.fee;
        transfer.log = replaceApostrophe(JSON.stringify(transactionData?.meta?.logMessages));

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

        const accounts = transactionData?.transaction.message.accountKeys;
        const instructions = transactionData?.meta?.innerInstructions;
        let lastSolTransfer = null;
        if (instructions && accounts) {
            for (const innerInstructions of instructions) {
                if (innerInstructions.instructions) {
                    for (const innerInstruction of innerInstructions.instructions) {
                        if (accounts[innerInstruction.programIdIndex].equals(TOKEN_PROGRAM_ID)) {
                            const data = bs58.decode(innerInstruction.data).toString('hex');
                            if (data.substring(0,2) === "03" && lastSolTransfer) {
                                console.log("Token Transfer");
                                const price = bs58.decode(lastSolTransfer.data).toString('hex');
                                transaction.value = hexToDecimalLittleEndian(price.substring(8))/1000000000;
                                transaction.vol = hexToDecimalLittleEndian(data.substring(2));

                                wallet.from_wallet_address = accounts[innerInstruction.accounts[0]].toString();
                                wallet.to_wallet_address = accounts[innerInstruction.accounts[1]].toString();
            
                                //TODO: to_wallet_address is a token account, fix if we need to store the owner of this token account instead
                            }
                        } else if (accounts[innerInstruction.programIdIndex].equals(SYSTEM)) {
                            lastSolTransfer = innerInstruction;
                        }

                    }
                }
            }
        }

        console.log(wallet);
        console.log(block);
        console.log(collection);
        console.log(token);
        console.log(transaction);
        console.log(transfer);
    }, "finalized", [{ memcmp: {
        bytes: 'jpXCZedGfVR',
        offset: 36
    }}]);
})();

/*(async () => {
    const token: any = {};
    const collection: any = {};
    const block: any = {};
    const transaction: any = {};
    const wallet: any = {};
    const transfer: any = {};

    const signatures = await connectionHttp.getConfirmedSignaturesForAddress2(new PublicKey('G9d16GtWv7sKCvoyig2TztyRGLFT1Wnt71yaXegUiPre'));

    token.address = keyedAccountInfo.accountId.toString();

    const signatures = await connectionHttp.getConfirmedSignaturesForAddress2(new PublicKey(token.address));
    //TODO: Set up a filter to process only relevant (latest?) transactions
    //TODO: Right now too many requests. Maybe create a queue to process transactions asynchronous

    transaction.signature = '5uTyM3fDVH4BrehvLq11vES4w2kBQCfh4Sm1QBRcom8wdH8mRrkyATMjVVCGHaKjMjuvc897yVtpPLJgcx1bmSB1';
    const transactionData = await connectionHttp.getTransaction(transaction.signature);
    transaction.recent_blockhash = transactionData?.transaction.message.recentBlockhash;
    transaction.fee = transactionData?.meta?.fee;
    transfer.log = replaceApostrophe(JSON.stringify(transactionData?.meta?.logMessages));

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

    const accounts = transactionData?.transaction.message.accountKeys;
    const instructions = transactionData?.meta?.innerInstructions;
    let lastSolTransfer = null;
    if (instructions && accounts) {
        for (const innerInstructions of instructions) {
            if (innerInstructions.instructions) {
                for (const innerInstruction of innerInstructions.instructions) {
                    if (accounts[innerInstruction.programIdIndex].equals(TOKEN_PROGRAM_ID)) {
                        const data = bs58.decode(innerInstruction.data).toString('hex');
                        if (data.substring(0,2) === "03" && lastSolTransfer) {
                            console.log("Token Transfer");
                            const price = bs58.decode(lastSolTransfer.data).toString('hex');
                            transaction.value = hexToDecimalLittleEndian(price.substring(8))/1000000000;
                            transaction.vol = hexToDecimalLittleEndian(data.substring(2));

                            wallet.from_wallet_address = accounts[innerInstruction.accounts[0]].toString();
                            wallet.to_wallet_address = accounts[innerInstruction.accounts[1]].toString();
        
                            //TODO: to_wallet_address is a token account, fix if we need to store the owner of this token account instead
                        }
                    } else if (accounts[innerInstruction.programIdIndex].equals(SYSTEM)) {
                        lastSolTransfer = innerInstruction;
                    }

                }
            }
        }
    }

    console.log(wallet);
    console.log(block);
    console.log(collection);
    console.log(token);
    console.log(transaction);
    console.log(transfer);
})();*/

function replaceApostrophe(str: string) {
    return str ? str.replace(/'/g, '\'\'') : '';
}

function hexToDecimalLittleEndian(endian: string) {
    return parseInt('0x' + endian.match(/../g)?.reverse().join(''));
}