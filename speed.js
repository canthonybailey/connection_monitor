'use strict'
const speedTest = require('speedtest-net');

var asyncSpeedTest = async function () {
  
  await speedTest({'acceptLicense':true})
  .then((result) => {
    console.log(result)
  })
  .catch( (err) => {
    console.log(err.message);
  })

}


module.exports = {
  'asyncSpeedTest': asyncSpeedTest
};


var testThisModule = async function () {
  await asyncSpeedTest()
  .then( (res) => {})
  .catch( (err) => {})

  return 
}

//  test if run directly
if (require.main === module) {
  console.log('called directly');
  testThisModule()

}