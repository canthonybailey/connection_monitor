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

  switch (device.toLowerCase()) {
    case 'docsis-gateway':
    case 'miney':
    case 'eeny':
    case 'bailey-nas':
    case 'apple-tv':
    case 'android-1f4e9150981d779': //living-room tv

      connection = 'wired'
      break;

    case 'pisumpmonitor':
    case 'epsonba9427':
    case 'epson78e3a4':
    case 'portal':
    case 'chromecast':
    case 'chromecast-751':
    case 'alexa':

      connection = 'wifi'
      break;

    case 'tonys-s8':
    case 'tonys-ipad':
    case 'patricias-ipad2':
    case 'patricias-iphone':
    case 'zoes-phone':
    case 'allisons-ipad':
    case 'nates-iphone':

      connection = 'portable'
      break;

    default:
      connection = "external"
  }

  return (connection)
}

var probeNetwork = function (testMode) {

  // list of hosts to validate
  const source = os.hostname().toLowerCase();
  var destinations = ['docsis-gateway', 'google.com', 'yahoo.com', 
                      "eeny", "miney", "bailey-nas", 'apple-tv', 'android-1f4e9150981d779', 'chromecast', 'chromecast-751',
                      "pisumpmonitor", "epsonba9427", "epson78e3a4",  
                      'tonys-s8', 'tonys-ipad', 'patricas-ipad2', 'patricas-iphone', 'zoes-phone'];
  var cfg = {
    timeout: 10,
    extra: ['-c', '2'],
  };
  // Running with default config
  let testTime = Date.now()
  destinations.forEach((destination) => {
    ping.promise.probe(destination, cfg)
      .then(function (res) {

        destination = destination.toLowerCase()

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
        if (testMode == false) {
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
const oneShot = false

if (oneShot==true) {
  probeNetwork(testMode)
} else {
  const pollSeconds = testMode ? 10 : 10 * 60
  setInterval(probe => probeNetwork(testMode), pollSeconds * 1000)  
}


const speedTestPollSeconds = 20
//setInterval(speed.asyncSpeedTest, speedTestPollSeconds)