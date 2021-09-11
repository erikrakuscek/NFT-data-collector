import Web3 from 'web3';

const providerHttp = 'http://localhost:8545';
var web3ProviderHttp = new Web3.providers.HttpProvider(providerHttp);
var web3Http = new Web3(web3ProviderHttp);

const providerWs = 'ws://localhost:8546';
var web3ProviderWs = new Web3.providers.WebsocketProvider(providerWs);
var web3Ws = new Web3(web3ProviderWs);

// returns data about the specified block, takes block number or hash as argument
/*web3Ws.eth.getBlock(3600576).then((result) => {
  console.log(result);
});*/

// subscribe to new block headers
var subscription = web3Ws.eth.subscribe('newBlockHeaders', function(error, result){
    if (!error) {
        console.log("result");
        console.log(result);

        return;
    }

    console.error(error);
})
.on("connected", function(subscriptionId){
    console.log("connected");
    console.log(subscriptionId);
})
.on("data", function(blockHeader){
    console.log("data");
    console.log(blockHeader);
})
.on("error", console.error);
