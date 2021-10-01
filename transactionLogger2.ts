import { Connection, PublicKey, Context, KeyedAccountInfo, TransactionResponse } from "@solana/web3.js";
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
  
    const trans = await connectionHttp.getTransaction("4u5C5p4yD6Z257wjFRbgvArB8bQayWCKbMgYaZZAhvwAsjAzjJPv8erdwAsZN2MPJPcVxXDZsYHv94SYH17L3fwo");
    const instructions = trans?.meta?.innerInstructions;
    //console.log(instructions)

    //Find Token Transfer
    const accounts = trans?.transaction.message.accountKeys;

    const inst_array = instructions? instructions.map(i => i.instructions) : [];
    const inst = [];
    for(const e of inst_array){
        inst.push(...e)
    }
    console.log(inst)

    const tokenTransferInstruction = inst.filter(i => { 
        let result = false;
        if(accounts){
            result = accounts[i.programIdIndex].equals(TOKEN_PROGRAM_ID) && bs58.decode(i.data).toString('hex').substring(0,2) === '03'            
        }
        return result
    })[0];
    console.log(tokenTransferInstruction)
    const sourceAcount = accounts? accounts[tokenTransferInstruction.accounts[0]].toString() : "";
    const destinationAccount = accounts? accounts[tokenTransferInstruction.accounts[1]].toString() : "";

    console.log(sourceAcount)
    console.log(destinationAccount)

    //find buyer address, search for initialize account instrutions where initAccount equals destinationAccounts.

    const initializeAccountInstruction = inst.filter(i => { 
        let result = false;
        if(accounts){
            result = accounts[i.programIdIndex].equals(TOKEN_PROGRAM_ID) && bs58.decode(i.data).toString('hex').substring(0,2) === '01'            
        }
        return result
    })[0];

    console.log(initializeAccountInstruction)
    const buyerAcount = accounts? accounts[initializeAccountInstruction.accounts[2]].toString() : "";

    console.log(buyerAcount)

  
    console.log("----------------------------------------------------")
    const sellerAcount = getSeller(sourceAcount)

    

})();
function concateInstructions(trans : any){

    const outerInstructions = trans?.transaction.message.instructions;
    const instructions = trans?.meta?.innerInstructions;

    const inst_array = instructions? instructions.map((i:any) => i.instructions) : [];
    const inst = [];
    for(const e of inst_array){
        inst.push(...e)
    }
    //console.log(inst)
    return inst.concat(outerInstructions)
}
//find seller address, get all transactions of sourceAccount, get info about the first transaction, get initialize account instrutions where initAccount equals sourceAccount.
async function getSeller(address: string){
    console.log(address)
    const sigs = await connectionHttp.getConfirmedSignaturesForAddress2(new PublicKey(address));
    const trans_sig = sigs[sigs.length-1].signature;

    const trans = await connectionHttp.getTransaction(trans_sig);

    const inst = concateInstructions(trans);

    console.log(inst)


    const accounts = trans?.transaction.message.accountKeys;

    const initializeAccountInstruction = inst.filter(i => { 
        let result = false;
        if(accounts){
            result = accounts[i.programIdIndex].equals(TOKEN_PROGRAM_ID) && bs58.decode(i.data).toString('hex').substring(0,2) === '01'            
        }
        return result
    })[0];

    console.log(initializeAccountInstruction)
    const sellerAcount = accounts? accounts[initializeAccountInstruction.accounts[2]].toString() : "";

    console.log(sellerAcount)
    return sellerAcount
}

/*(async () => {
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
})();*/

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