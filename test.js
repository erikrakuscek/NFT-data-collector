var request = require('request');
var r = request.get('https://arweave.net/OeM6B8S7IYRRh0VgPf6MlP38o12tnlVVYpLhdbluu_4', function (err, res, body) {
console.log(res.request.uri.href);
var XMLHttpRequest = require('xhr2');
var req = new XMLHttpRequest();
req.onreadystatechange = function() {
    if (req.readyState === 4) {       
        var response = req.responseText;
        //console.log(response)
        var json = JSON.parse(response);
        console.log(json)
    }
};

req.open('GET', res.request.uri.href);
req.send(null);
});

