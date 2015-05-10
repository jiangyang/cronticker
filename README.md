### CronTicker

Set cron taskes and get notified when the task should trigger.

To install...
```
npm install cronticker
```

And then...

```javascript
var CronTicker = require('cronticker')
var ticker =  new CronTicker()
ticker.on('task', function(id, cur, next) {
  // id is the name you set
  // cur is the timestamp when the cron is supposed to trigger
  // next is the next timestamp when the cron is supposed to trigger
})

// cron expr starts always with second
ticker.set('mytask', '* * * * * *') // the above event listener will get called once per second
// change schedule on the fly
ticker.set('mytask', '0 * * * * *')
// when no longer needed
ticker.del('mytask')

```

See test/* for more examples.