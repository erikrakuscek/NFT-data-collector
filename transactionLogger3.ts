import { Connection, PublicKey, Context, KeyedAccountInfo, CompiledInnerInstruction, CompiledInstruction, TransactionResponse } from "@solana/web3.js";
import { getMetadata, getMetadataFromUrl } from "./utils/metadata";
import { TOKEN_PROGRAM_ID, SYSTEM } from "./utils/ids";
import {  interval } from 'rxjs';
import { createDatabase, insert, select, update, dropDatabase } from "./utils/postgresql";
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

createDatabase();
//dropDatabase();

let processing: boolean = false;
let queue: any[] = [];
interval(200).subscribe(async () => {
    if (processing) {
        console.log("Still processing previous element...");
        return;
    } else if (queue.length === 0) {
        console.log("queue elements: ", queue.length, "  address: ");
        return;
    }
    processing = true;

    const element = queue.pop();
    const tokenAddress = element ? element.tokenAddress : '';
    const slot = element ? element.slot : 0;
    console.log("queue elements: ", queue.length, "  address: ", tokenAddress);
    
    // Get signatures of transactions regarding a token
    const signatures = await connectionHttp.getConfirmedSignaturesForAddress2(new PublicKey(tokenAddress));

    // Filter out only transactions that happened less than 50 slot ago
    if (signatures.length === 0 || signatures.length > 0 && slot - signatures[0].slot > 50) {
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
    const trans = await connectionHttp.getTransaction(transaction.signature);
    transaction.recent_blockhash = trans?.transaction.message.recentBlockhash;
    transaction.fee = trans?.meta?.fee;
    transfer.log = replaceApostrophe(JSON.stringify(trans?.meta?.logMessages));

    // Find token transfer
    const instructions = concatInstructions(trans!);
    const accounts = trans?.transaction.message.accountKeys;
    const tokenTransferInstruction = instructions.filter(i => accounts![i.programIdIndex].equals(TOKEN_PROGRAM_ID) && bs58.decode(i.data).toString('hex').substring(0,2) === '03');

    // Transaction is not a token transfer so no need to process further
    if (tokenTransferInstruction.length === 0) {
        processing = false;
        return;
    }

    const d = await getBuyerSellerPriceVolume(instructions, accounts, tokenTransferInstruction[0]);
    if (d === -1) {
        processing = false;
        return;
    }
    transaction.value = d.price;
    transaction.vol = d.volume;
    wallet.from_wallet_address = d.sellerAccount;
    wallet.to_wallet_address = d.buyerAccount;

    var slotNumber = trans?.slot;
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

    addToDatabase(wallet, block, collection, token, transaction, transfer);

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

async function addToDatabase(wallet: any, block: any, collection: any, token: any, transaction: any, transfer: any) {
    const from_wallet_id = await insert(`INSERT INTO Wallet (address) VALUES ('${wallet.from_wallet_address}') ON CONFLICT (address) DO UPDATE SET address = Wallet.address RETURNING id;`);
    const to_wallet_id = await insert(`INSERT INTO Wallet (address) VALUES ('${wallet.to_wallet_address}') ON CONFLICT (address) DO UPDATE SET address = Wallet.address RETURNING id;`);

    const block_id = await insert(`INSERT INTO Block (hash, block_time) VALUES ('${block.hash}', ${block.block_time}) RETURNING id;`);

    let collection_id = await select(`SELECT id FROM Collection WHERE name = '${collection.name}' AND family = '${collection.family}' AND external_url = '${collection.external_url}';`);
    if (!(collection_id[0] && collection_id[0].id)) {
        collection_id = await insert(`INSERT INTO Collection (name, family, external_url) VALUES ('${collection.name}','${collection.family}','${collection.external_url}') RETURNING id;`);
    } else {
        collection_id = collection_id[0].id;
    }
    
    const token_id = await insert(`INSERT INTO Token (collection_id, address, uri, asset_metadata, image_url, name, symbol, description, traits) VALUES (${collection_id},'${token.address}','${token.uri}','${token.asset_metadata}','${token.image_url}','${token.name}','${token.symbol}','${token.description}','${token.traits}') ON CONFLICT (address) DO UPDATE SET name = Token.name RETURNING id;`);

    const transaction_id = await insert(`INSERT INTO Transaction (signature, block_id, from_wallet_id, to_wallet_id, recent_blockHash, fee, value, vol) VALUES ('${transaction.signature}',${block_id},${from_wallet_id},${to_wallet_id},'${transaction.recent_blockhash}',${transaction.fee},${transaction.value},${transaction.vol}) RETURNING id;`);

    const transfer_id = await insert(`INSERT INTO Transfer (block_id, log, transaction_id, token_id, from_wallet_id, to_wallet_id) VALUES (${block_id},'${transfer.log}',${transaction_id},${token_id},${from_wallet_id},${to_wallet_id}) RETURNING id;`);
    
    await update(`UPDATE Token SET latest_transfer_id = ${transfer_id} WHERE id = ${token_id};`);
}

async function getBuyerSellerPriceVolume(instructions: CompiledInstruction[], accounts: PublicKey[] | undefined, tokenTransferInstruction: CompiledInstruction) {
    const sourceAcount = accounts? accounts[tokenTransferInstruction.accounts[0]].toString() : "";
    const destinationAccount = accounts? accounts[tokenTransferInstruction.accounts[1]].toString() : "";    

    const buyerAccount = await getBuyer(instructions, accounts, destinationAccount);
    if (buyerAccount === -1) return -1;
    const sellerAccount = await getSeller(sourceAcount)
    if (sellerAccount === -1) return -1;
    const price = getPrice(instructions, accounts, buyerAccount, sellerAccount);
    if (price === -1) return -1;
    const volume = hexToDecimalLittleEndian(bs58.decode(tokenTransferInstruction.data).toString('hex').substring(2));

    return { buyerAccount, sellerAccount, price, volume }
}

function concatInstructions(trans : TransactionResponse): CompiledInstruction[] {
    const instructions = trans?.transaction.message.instructions;
    const inner = trans?.meta?.innerInstructions;
    const innerArr = inner ? inner.map((i: CompiledInnerInstruction) => i.instructions) : [];
    for (const e of innerArr){
        instructions.push(...e);
    }
    return instructions;
}

// Find buyer address, search for initialize account instrutions where initAccount equals destinationAccounts.
async function getBuyer(instructions: CompiledInstruction[], accounts: PublicKey[] | undefined, destinationAccount: string){
    const initializeAccountInstruction = instructions.filter((i: CompiledInstruction) =>
        accounts![i.programIdIndex].equals(TOKEN_PROGRAM_ID) &&
        bs58.decode(i.data).toString('hex').substring(0,2) === '01' &&
        accounts![i.accounts[0]].toString() === destinationAccount
    );
    if (initializeAccountInstruction.length === 0) {
        return -1;
    }
    return accounts? accounts[initializeAccountInstruction[0].accounts[2]].toString() : "";
}

// Find seller address, get all transactions of sourceAccount, get info about the first transaction, get initialize account instrutions where initAccount equals sourceAccount.
async function getSeller(address: string){
    const sigs = await connectionHttp.getConfirmedSignaturesForAddress2(new PublicKey(address));
    const trans = await connectionHttp.getTransaction(sigs[sigs.length-1].signature);
    const accounts = trans?.transaction.message.accountKeys;
    const instructions = concatInstructions(trans!);

    const initializeAccountInstruction = instructions.filter((i: CompiledInstruction) => accounts![i.programIdIndex].equals(TOKEN_PROGRAM_ID) && bs58.decode(i.data).toString('hex').substring(0,2) === '01');
    if (initializeAccountInstruction.length === 0) {
        return -1;
    }
    return accounts? accounts[initializeAccountInstruction[0].accounts[2]].toString() : "";
}

// Find SOL transfer instruction that involves given buyer and seller
function getPrice(instructions: CompiledInstruction[], accounts: PublicKey[] | undefined, buyerAccount: string, sellerAccount: string) {
    const solTransferInstruction = instructions.filter((i: CompiledInstruction) =>
        accounts![i.programIdIndex].equals(SYSTEM) &&
        bs58.decode(i.data).toString('hex').substring(0,2) === '02' &&
        accounts![i.accounts[0]].toString() === buyerAccount &&
        accounts![i.accounts[1]].toString() === sellerAccount
    );
    if (solTransferInstruction.length === 0) {
        return -1;
    }
    const price = bs58.decode(solTransferInstruction[0].data).toString('hex');
    return hexToDecimalLittleEndian(price.substring(8))/1000000000;
}

function replaceApostrophe(str: string) {
    return str ? str.replace(/'/g, '\'\'') : '';
}

function hexToDecimalLittleEndian(endian: string) {
    return parseInt('0x' + endian.match(/../g)?.reverse().join(''));
}