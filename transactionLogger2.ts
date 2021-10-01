import { Connection, PublicKey, TransactionResponse, CompiledInnerInstruction, CompiledInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, SYSTEM } from "./utils/ids";
import * as bs58 from "bs58";

// Connect to cluster
var connectionHttp = new Connection(
    'http://api.mainnet-beta.solana.com',
    "confirmed"
);

(async () => {
    const trans = await connectionHttp.getTransaction("4u5C5p4yD6Z257wjFRbgvArB8bQayWCKbMgYaZZAhvwAsjAzjJPv8erdwAsZN2MPJPcVxXDZsYHv94SYH17L3fwo");
    const instructions = concatInstructions(trans!);
    const accounts = trans?.transaction.message.accountKeys;

    // Find token transfer
    const tokenTransferInstruction = instructions.filter(i => accounts![i.programIdIndex].equals(TOKEN_PROGRAM_ID) && bs58.decode(i.data).toString('hex').substring(0,2) === '03')[0];
    const sourceAcount = accounts? accounts[tokenTransferInstruction.accounts[0]].toString() : "";
    const destinationAccount = accounts? accounts[tokenTransferInstruction.accounts[1]].toString() : "";

    const buyerAccount = await getBuyer(instructions, accounts, destinationAccount);
    const sellerAccount = await getSeller(sourceAcount)
    const price = getPrice(instructions, accounts, buyerAccount, sellerAccount);
    const volume = hexToDecimalLittleEndian(bs58.decode(tokenTransferInstruction.data).toString('hex').substring(2));

    console.log(buyerAccount, sellerAccount, price, volume)
})();

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
    )[0];
    return accounts? accounts[initializeAccountInstruction.accounts[2]].toString() : "";
}

// Find seller address, get all transactions of sourceAccount, get info about the first transaction, get initialize account instrutions where initAccount equals sourceAccount.
async function getSeller(address: string){
    const sigs = await connectionHttp.getConfirmedSignaturesForAddress2(new PublicKey(address));
    const trans = await connectionHttp.getTransaction(sigs[sigs.length-1].signature);
    const accounts = trans?.transaction.message.accountKeys;
    const instructions = concatInstructions(trans!);

    const initializeAccountInstruction = instructions.filter((i: CompiledInstruction) => accounts![i.programIdIndex].equals(TOKEN_PROGRAM_ID) && bs58.decode(i.data).toString('hex').substring(0,2) === '01')[0];
    return accounts? accounts[initializeAccountInstruction.accounts[2]].toString() : "";
}

// Find SOL transfer instruction that involves given buyer and seller
function getPrice(instructions: CompiledInstruction[], accounts: PublicKey[] | undefined, buyerAccount: string, sellerAccount: string) {
    const solTransferInstruction = instructions.filter((i: CompiledInstruction) =>
        accounts![i.programIdIndex].equals(SYSTEM) &&
        bs58.decode(i.data).toString('hex').substring(0,2) === '02' &&
        accounts![i.accounts[0]].toString() === buyerAccount &&
        accounts![i.accounts[1]].toString() === sellerAccount
    )[0];
    const price = bs58.decode(solTransferInstruction.data).toString('hex');
    return hexToDecimalLittleEndian(price.substring(8))/1000000000;
}

function hexToDecimalLittleEndian(endian: string) {
    return parseInt('0x' + endian.match(/../g)?.reverse().join(''));
}