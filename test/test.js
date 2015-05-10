var assert = require('assert')
var sinon = require('sinon')
var CronTicker = require('../index')

describe('cron ticker', function() {
  var clock
  var ct = new CronTicker()

  beforeEach(function(done) {
    ct.reset(true)
    clock = sinon.useFakeTimers(Date.now())
    done()
  })

  afterEach(function(done) {
    clock.restore()
    done()
  })

  it('should error invalid cron', function(done){
    var err = false
    try {
      ct.set('foo', '99 2 * * * * *')
      assert(false)
    } catch(ex) {
      err = true
      assert(true)
    }
    assert(err)
    done()
  })

  it('should tick per 1 second and set new id/update schedule etc', function(done) {
    ct.set('foo', '* * * * * *')
    var acc = 0
    var barSched = 1
    ct.on('task', function(id, cur, next) {
      acc += 1
      if (id === 'foo') assert.equal(1000, next - cur)
      if (id === 'bar' && barSched === 1) assert.equal(1000, next - cur)
      if (id === 'bar' && barSched === 2) assert.equal(2000, next - cur)
    })
    clock.tick(5000)
    assert.equal(5, acc)
    ct.del('foo')
    clock.tick(5000)
    assert.equal(5, acc)
    ct.set('bar', '* * * * * *')
    clock.tick(5000)
    assert.equal(10, acc)
    ct.set('bar', '0/2 * * * * *')
    barSched = 2
    clock.tick(8000)
    assert.equal(14, acc)
    done()
  })

  it('should tick per minute', function(done) {
    ct.set('bar', '0 * * * * *')
    var acc = 0
    ct.on('task', function(id, cur, next) {
      acc += 1
      assert.equal(1000 * 60, next - cur)
      assert.equal('bar', id)
    })
    clock.tick(1000 * 60 * 3)
    process.nextTick(function(){
      assert.equal(3, acc)
      done()
    })
  })

  it('should tick per longer than max time out', function(done) {
    ct.set('bar', '0 0 0 1 * *')
    var acc = 0
    ct.on('task', function(id, cur, next) {
      acc += 1
      assert.equal('bar', id)
    })
    clock.tick(1000 * 60 * 60 * 24 * 61)
    assert.equal(2, acc)
    done()
  })

  it('should tick mixed', function(done) {
    ct.set('minute', '0 0/1 * * * *')
    ct.set('sec15', '0/15 * * * * *')
    var minAcc = 0
    var sec15Acc = 0

    ct.on('task', function(id, cur, next) {
      switch(id) {
        case 'minute':
          minAcc += 1
          break
        case 'sec15':
          sec15Acc += 1
          break
      }
    })
    clock.tick(1000 * 60 * 4)
    assert.equal(16, sec15Acc)
    assert.equal(4, minAcc)
    done()
  })

  it('should tick per 2 second with minTick set to 2 second', function(done) {
    var ct2 = new CronTicker({minTick: 2000})
    ct2.set('foo', '* * * * * *')
    var acc = 0
    ct2.on('task', function(id, cur, next) {
      acc += 1
    })
    clock.tick(6000)
    assert.equal(3, acc)
    done()
  })

  it('should not tick for deleted task', function(done) {
    var ct3 = new CronTicker()
    var min = new Date().getMinutes()
    var sec = new Date().getSeconds()
    // console.log('minute/sec', min, sec)
    ct3.set('foo', sec + ' '+ (min + 1) +' * * * *')
    var triggerred = false
    ct3.on('task', function(id, cur, next) {
      triggerred = true
    })
    clock.tick(30000)
    ct3.del('foo')
    clock.tick(30000)
    assert(!triggerred)
    done()
  })
})
