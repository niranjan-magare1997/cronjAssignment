const schedule = require('node-schedule')
const eventEmitter = require('./emitter')

const scheduler = schedule.scheduleJob('*/5 * * * *', () => {
  console.log('\nTask executed every minute:', new Date().toLocaleTimeString());
  eventEmitter.emit('doScheduledTasks')
});