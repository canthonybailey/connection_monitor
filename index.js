'use strict'
var esutils = require('./esutils.js');
var ping = require('ping');

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

var hosts = ['docsis-gateway', 'google.com', 'yahoo.com', "eeny", "miney", "bailey-nas", "pisumpmonitor", "EPSONBA9427", "EPSON78E3A4"];

// Running with default config
hosts.forEach((host) => {
    ping.promise.probe(host)
        .then(function (res) {
            console.log("sending to index", res);
            esutils.sendDataToIndex(res, "network-ping-test", indexName)
        })
        .catch((err) => {
            console.log(err)
        })
        .done();
});

