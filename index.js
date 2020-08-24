'use strict'
var esutils = require('./esutils.js');
var speed = require('./speed.js');
var ping = require('ping');
var os = require('os');

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

let setupConnection = async function () {

  // setup connection to elasticsearch server
  if (esutils.checkServer() == false) {
    console.error("can not reach elasticsearch server")
    exit(1)
  }

  esutils.createIndex(indexName, indexConfig);
}


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
    case 'patricas-ipad2':
    case 'patricas-iphone':
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


let sendProbeResults = async function (source, destination, testTime, res) {
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

  let sendResults = !testMode

  if (testMode == false) {
    sendResults = await esutils.sendDataToIndex(payload, "network-ping-test", indexName)
      .catch((err) => {
        console.error("caught error", err)
        return ("send error")
      })
  }

  console.log("sent to index", source, destination, res.alive, res.avg, sendResults._id);

}


let probeNetwork = async function (testMode) {

  // get sourcename
  const source = os.hostname().toLowerCase();

  // list of hosts to validate
  var destinations = ['docsis-gateway', 'google.com', 'yahoo.com',
    "eeny", "miney", "bailey-nas", 'apple-tv', 'android-1f4e9150981d779', 'chromecast', 'chromecast-751',
    "pisumpmonitor", "epsonba9427", "epson78e3a4",
    'tonys-s8', 'tonys-ipad', 'patricas-ipad2', 'patricas-iphone', 'zoes-phone'];

  // check elk server status
  await setupConnection()

  // use common time to align test results
  let testTime = Date.now()

  for (let destination of destinations) {
    let pingResult = await ping.promise.probe(destination)
      .catch((err) => { console.error(err) })
    let sendResult = await sendProbeResults(source, destination, testTime, pingResult)
      .catch((err) => { console.error(err) })

    //console.log("test", pingResult, sendResult)
  }

}

//TODO recover from error, reset client
//TODO logging
//TODO run as service
const testMode = false
const oneShot = true

if (oneShot == true) {
  probeNetwork(testMode)
} else {
  const pollSeconds = testMode ? 10 : 10 * 60
  setInterval(probe => probeNetwork(testMode), pollSeconds * 1000)
}


const speedTestPollSeconds = 20
//setInterval(speed.asyncSpeedTest, speedTestPollSeconds)