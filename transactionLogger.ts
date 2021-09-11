import * as web3 from "@solana/web3.js";

(async () => {
    // Connect to cluster
    var connectionHttp = new web3.Connection(
        'http://api.mainnet-beta.solana.com',
        "confirmed"
    );
    var connectionWs = new web3.Connection(
        'ws://api.mainnet-beta.solana.com',
        "confirmed"
    );

    connectionWs.onLogs('all', (logs, ctx) => {
        if (logs.logs.join(' ').includes('NFT')){
            console.log(logs);
        }
    })
})();

/*connectionHttp.getTransaction('22KDDVLjUu6BXmBMy1VXwbn7i2g2tjaopWtw6JVvVdZ9HaLr7762eu77kqFGc7LvTz1v66tMUMR1xFnodTfXyCGu').then(balance => {
    console.log(balance)
    console.log(balance.meta.postTokenBalances)
    console.log(balance.meta.preTokenBalances)
}).catch(e => console.log(e))*/

/*connectionHttp.getParsedAccountInfo(new web3.PublicKey('23BkLv9wRfvuBj3Mtm6kXZkMXQB2dezDvnhVP7WRXCff')).then(info => {
    console.log("info")
    console.log(info)
    console.log(info.value.data.parsed)
}).catch(e => console.log(e))*/
