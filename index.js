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
let indexName = "network"
let indexConfig = {
    "mappings": {
      "_doc": {
        "properties": {
          "destination": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "elapsedTime": {
            "type": "float"
          },
          "source": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "success": {
            "type": "long"
          },
          "timestamp": {
            "type": "date",
            "format": "epoch_millis"
          }
        }
      }
    }
  }

esutils.createIndex(indexName, indexConfig);

var probeNetwork = function () {

    // list of hosts to validate
    const source = os.hostname();
    var destinations = ['docsis-gateway', 'google.com', 'yahoo.com', "eeny", "miney", "bailey-nas", "pisumpmonitor", "EPSONBA9427", "EPSON78E3A4"];

    // Running with default config
    destinations.forEach((destination) => {
        ping.promise.probe(destination)
            .then(function (res) {

                let payload = {
                    'timestamp': Date.now(),
                    'source': source,
                    'destination': destination,
                    'success': res.alive ? 1: 0,
                    'elapsedTime': res.alive ? parseFloat(res.avg) : ""
                };

                console.log("sending to index", JSON.stringify(payload));
                esutils.sendDataToIndex(payload, "network-ping-test", indexName)
            })
            .catch((err) => {
                console.log(err)
            })
            .done();
    });


}

//TODO recover from error, reset client
//TODO logging
//TODO run as service
const pollSeconds = 10 // 10*60
setInterval(probeNetwork,pollSeconds*1000)
