var util = require('util')
var EventEmitter = require('events').EventEmitter
var later = require('later')
var Heap = require('heap')

const MAX_TIME_OUT = 0x7FFFFFFF
const DEFAULT_MIN_TICK = 1000

function compTask(t1, t2) {
  if (t1.dead && !t2.dead) return -1
  if (!t1.dead && t2.dead) return 1
  return t1.nextTick - t2.nextTick
}

// cron expr starts with seconds
function Task(id, cron, minTick) {
  this.id = id
  this.cron = cron
  this.nextTick = later.schedule(later.parse.cron(cron, true)).next(1, Date.now() + minTick).getTime()
  this.dead = false
}

function CronTicker(opts) {
  var self = this
  var tasks = {}
  var heap = new Heap(compTask)
  var curTimeout
  var minTick = DEFAULT_MIN_TICK
  // opts
  if (opts && opts.minTick && opts.minTick > DEFAULT_MIN_TICK && minTick <= MAX_TIME_OUT)
    minTick = opts.minTick

  function kill(tid) {
    if (!tasks[tid]) return
    tasks[tid].dead = true
    heap.updateItem(tasks[tid])
    delete tasks[tid]
  }

  function add(tid, task) {
    tasks[tid] = task
    heap.push(task)
  }

  function tick() {
    if (curTimeout) {
      clearTimeout(curTimeout)
      curTimeout = null
    }
    var t
    while(!heap.empty()) {
      t = heap.peek()
      if (t.dead) {
        heap.pop()
        delete tasks[t.id]
        continue
      }

      var sleep = t.nextTick - Date.now()
      if (sleep > MAX_TIME_OUT) sleep = MAX_TIME_OUT
      if (sleep > 0) {
        curTimeout = setTimeout(tick, sleep)
        return
      }

      t = heap.pop()
      // set the next event with offset set to minTick
      newT = new Task(t.id, t.cron, minTick)
      add(t.id, newT)
      self.emit('task', t.id, t.nextTick, newT.nextTick)
    }
  }

  this.set = function(tid, tcron) {
    tid = String(tid)
    var newT = new Task(tid, tcron, minTick)
    if (!isFinite(newT.nextTick)) throw new Error('finite number only, trying something too far out?')
    if (tasks[tid]) { // existing key, update
      var oldT = tasks[tid]
      // when nextTick is same simply update task's cron
      if (0 === compTask(oldT, newT)) {
        if (newT.cron !== oldT.cron) oldT.cron = newT.cron
        return
      }
      // otherwise, kill the current task and add the new one
      kill(tid)
      add(tid, newT)
      tick()
      return
    }
    // new key, add
    add(tid, newT)
    tick()
  }

  this.del = function(tid) {
    kill(String(tid))
    tick()
  }

  this.reset = function(removeListener) {
    tasks = {}
    heap = new Heap(compTask)
    if (curTimeout) {
      clearTimeout(curTimeout)
      curTimeout = null
    }
    if (removeListener) {
      this.removeAllListeners()
    }
  }
}
util.inherits(CronTicker, EventEmitter)

module.exports = CronTicker