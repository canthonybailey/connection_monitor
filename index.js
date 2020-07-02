'use strict'
var esutils = require('./esutils.js');
var ping = require('ping');
var os = require('os');

// setup connection to elasticsearch server
if (esutils.checkServer() == false) {
    console.error("can not reach elasticsearch server")
    exit(1)
}

// create index if needed
const indexName = "network"
if (esutils.checkIndexExists(indexName) == false) {
    if (esutils.createIndex(index) == false) {
        console.error("could not create index", indexName)
        exit(1)
    }
}


// list of hosts to validate
const source = os.hostname();
var destinations = ['docsis-gateway', 'google.com', 'yahoo.com', "eeny", "miney", "bailey-nas", "pisumpmonitor", "EPSONBA9427", "EPSON78E3A4"];

// Running with default config
destinations.forEach((destination) => {
    ping.promise.probe(destination)
        .then(function (res) {

            let payload = {
                'timestamp' : Date.now(),
                'source' : source,
                'destination' : destination,
                'success' : res.alive,
                'elapsedTime' : res.alive ? parseFloat(res.avg) : ""
            };

            console.log("sending to index", JSON.stringify(payload));
            esutils.sendDataToIndex(payload, "network-ping-test", indexName)
        })
        .catch((err) => {
            console.log(err)
        })
        .done();
});

