'use strict'
var esutils = require('./esutils.js');
var speed = require('./speed.js');
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

let connectionType = function (device) {
  let connection = "unknown"

  switch (device) {
    case 'docsis-gateway':
    case 'miney':
    case 'eeny':
    case 'bailey-nas':

      connection = 'wired'
      break;

    case 'pisumpmonitor':
    case 'EPSONBA9427':
    case 'EPSON78E3A4':

      connection = 'wifi'
      break;

    default:
      connection = "external"
  }

  return (connection)
}

var probeNetwork = function (testMode) {

  // list of hosts to validate
  const source = os.hostname();
  var destinations = ['docsis-gateway', 'google.com', 'yahoo.com', "eeny", "miney", "bailey-nas", "pisumpmonitor", "EPSONBA9427", "EPSON78E3A4"];

  // Running with default config
  let testTime = Date.now()
  destinations.forEach((destination) => {
    ping.promise.probe(destination)
      .then(function (res) {

        let payload = {
          'timestamp': testTime,
          'source': source,
          'sourceType': connectionType(source),
          'destination': destination,
          'destinationType': connectionType(destination),
          'success': res.alive ? 1 : 0,
          'elapsedTime': res.alive ? parseFloat(res.avg) : ""
        };

        console.log("sending to index", JSON.stringify(payload));
        if(testMode == false){
          esutils.sendDataToIndex(payload, "network-ping-test", indexName)
        }
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
const testMode = false
const pollSeconds = testMode ? 10 : 10 * 60

setInterval(probe => probeNetwork(testMode), pollSeconds * 1000)


const speedTestPollSeconds = 20
//setInterval(speed.asyncSpeedTest, speedTestPollSeconds)