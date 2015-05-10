var CronTicker = require('../index')
var logger = require('winston')

var ct = new CronTicker()
ct.on('task', function(id, ts, future) {
  logger.info('task: %s triggered at %s (%d) next trigger at %s ', id, new Date(), Date.now() - ts, new Date(future), '')
})

try {
  ct.set('every 10 sec', '0/10 * * * * *')
  ct.set('every 15 sec', '0/15 * * * * *')
  ct.set('every minute', '0 * * * * *')
  ct.set('every 2 minute', '0 0/2 * * * *')
} catch(exx) {
  logger.error(exx)
}