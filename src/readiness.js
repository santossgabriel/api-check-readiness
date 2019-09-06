const fs = require('fs')

const { runRequest } = require('./request')
const { notifyError, notifySuccess } = require('./notifier')

let missing = 0
let errors = []
let requests = []
let totalServicesCount = 0
let notificationSystemEnabled = false

function requestFinish(e, callback) {
  requests.push(e)
  if (e.error)
    errors.push(e)
  missing--
  if (missing === 0) {
    // errors.forEach(p => console.log('\x1b[31m%s\x1b[0m', JSON.stringify(p)))
    if (notificationSystemEnabled)
      if (errors.length)
        notifyError(`${errors.length}/${totalServicesCount} serviço(s) com problema.`)
      else
        notifySuccess(`${totalServicesCount} serviços OK.`)
    errors = []
    if (callback)
      callback(requests)
  }
}

const run = (filePath, callback) => {

  if (!fs.existsSync(filePath))
    return console.log('\x1b[31m%s\x1b[0m', `${filePath} não localizado`)

  const endpoints = JSON.parse(fs.readFileSync(filePath, 'utf-8')).filter(p => p.enabled)
  missing = endpoints.length
  totalServicesCount = missing

  endpoints.forEach(p => {
    runRequest(p)
      .then((e) => requestFinish(e, callback))
      .catch(e => requestFinish(e, callback))
  })
}

const startCheckReadiness = (requestsFilePath, callback, time, notifyEnabled = false) => {
  notificationSystemEnabled = notifyEnabled
  run(requestsFilePath, callback)
  setInterval(() => run(requestsFilePath), (time || 60) * 1000)
}

module.exports = {
  startCheckReadiness
}