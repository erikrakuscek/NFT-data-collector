import * as web3 from "@solana/web3.js";
import * as metadata from "./metadata";
import { PublicKey } from "@solana/web3.js";

const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const tokenAddress = new PublicKey(
  "BBpDX1R3PxShTVoYTohycEs2v2d7SXkvoi39B9zqzeBx"
);

async function getMetadataAccount(
  tokenMint: PublicKey
): Promise<web3.PublicKey> {
  const [addr, nr] = await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      tokenMint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  return addr;
}

(async () => {
  // Connect to cluster
  var connection = new web3.Connection(
    web3.clusterApiUrl("mainnet-beta"),
    "confirmed"
  );

  const m = await getMetadataAccount(tokenAddress);
  console.log("metadata acc: ", m);
  const accInfo = await connection.getAccountInfo(m);
  console.log(accInfo);

  // finally, decode metadata
  // get the decodeMetadata function from metaplex - https://github.com/metaplex-foundation/metaplex/blob/master/js/packages/common/src/actions/metadata.ts#L438
  console.log(metadata.decodeMetadata(accInfo!.data));
})();

