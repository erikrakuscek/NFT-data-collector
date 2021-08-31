import Web3 from 'web3';



//const Web3 = require("web3");
const web3 = new Web3("wss://bsc-ws-node.nariox.org:443")

//const web3 = new Web3('ws://localhost:8546')

web3.eth.subscribe("logs",{
    topics: [
        web3.utils.sha3("Transfer(address,address,uint256)"),
        null,
        null,
        null
    ]
},(error, result) => {
    if(error){
        console.error(error);
    }else{
        console.log(result);
        console.log("TokenId: "+ BigInt(result.topics[3]).toString(10))
        console.log("Contract address: " + result.address)
    }
});

