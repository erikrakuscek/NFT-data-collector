import * as web3 from "@solana/web3.js";
import * as https from 'https'

/*(async () => {
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
})();*/

// TODO: url rediects after called, that's why this url doesn't return a JSON
let url = "https://www.arweave.net/oY0PYiE2GUEBL1jR7LUvgEVEvV6yhSet7NePYTQ-JNs";

https.get(url,(res) => {
    let body = "";

    res.on("data", (chunk) => {
        body += chunk;
    });

    res.on("end", () => {
        try {
            const json = JSON.parse(body);
            console.error(json);
            // do something with JSON
        } catch (error) {
            console.error(error);
        };
    });

}).on("error", (error) => {
    console.error(error);
});

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
