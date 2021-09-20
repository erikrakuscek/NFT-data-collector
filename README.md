# NFT data collector

Gather data about NFTs from a blockchain. Store the data in a database for further analysis.

## SOLANA

### Setup
```bash
npm install
npm install -g ts-node
npm run start
```

### Database schema
![alt text](https://github.com/erikrakuscek/NFT-data-collector/blob//main/assets/dbschema.png?raw=true)

### Useful links
* https://solana-labs.github.io/solana-web3.js/
* https://docs.metaplex.com/
* https://solscan.io/
* https://ip0.com/

## BSC

### Setup
```bash
npm install web3
```

Run local full node
```bash
./geth_linux --config ./config.toml --datadir ./node  --cache 18000 --rpc.allow-unprotected-txs --txlookuplimit 0 --ipcpath ~/.bsc --ws
```

### Useful links
* https://web3js.readthedocs.io/en/v1.4.0/index.html
* https://docs.ethers.io/v5/concepts/events/
