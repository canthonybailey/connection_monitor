'use strict'
const { Client } = require('elasticsearch')


// function esutils() {

const esProxyID = "elk-server-admin"
const esProxyPass = "watchyourisp"
const esHost = "elk-server"
const esPort = "9201"
const esServerURL = `http://${esProxyID}:${esProxyPass}@${esHost}:${esPort}`;

var client = new Client({
    hosts: [esServerURL]
});

var checkServer = async function () {
    let result = false

    await client.ping(
        { requestTimeout: 30000 })
        .then((response) => {
            console.log("checkServer OK", response);
            result = true
        })
        .catch((error) => {
            console.log("checkServer", error)
        })

    return (result)
}

var checkIndexExists = async function (indexName) {
    let result = false

    await client.indices.exists(
        { "index": indexName })
        .then((response) => {
            console.log("checkIndexExists OK", response);
            result = response
        })
        .catch((error) => {
            console.log("checkIndexExists Error", error)
        })

    return (result)
}

var createIndex = async function (indexName, indexConfig) {
    let result = false

    let exists = await checkIndexExists(indexName);
    if (exists) { result = true; return (result) }
    console.log("after await checkIndexExists", indexName, exists)


    await client.indices.create(
        {
            "index": indexName,
            "body": indexConfig
        })
        .then((response) => {
            console.log("createIndex OK", response);
            result = true
        })
        .catch((error) => {
            console.log("error createIndex", indexName, error)
        })

    console.log("after await createIndex", indexName, result)
    return (result)
}

var sendDataToIndex = async function (doc, docType, indexName) {

    await client.index({
        'index': indexName,
        // 'id': '1',  // id automatically assigned if left blank
        'type': docType,
        'body': doc
    })
        .then((response) => {
            console.log("sendDataToIndex OK: _id=", JSON.stringify(response._id));
        })
        .catch((error) => {
            console.log("error createIndex", error)
        })

    return
}

module.exports = {
    'checkServer': checkServer,
    'checkIndexExists': checkIndexExists,
    'createIndex': createIndex,
    'sendDataToIndex': sendDataToIndex
};


var testRun = async function () {
    let indexName = "test"
    let indexConfig = {}
    await checkServer()
    await createIndex(indexName, indexConfig)
    await sendDataToIndex({ 'key': 'value' }, "network-ping-test", indexName)
    return (true)
}

//  test if run directly
if (require.main === module) {
    console.log('called directly');
    testRun()

}


