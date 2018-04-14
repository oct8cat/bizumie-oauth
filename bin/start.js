const {
  http: { createServer, startServer, stopServer },
  db: { createDb, connectDb, disconnectDb },
  env: { getEnvURL }
} = require('bizumie-common')
const { http: { createApp } } = require('..')

const start = () => {
  const db = createDb()
  const app = createApp({ db })
  const server = createServer(app)
  return connectDb(db)
    .then(() => startServer(server))
    .then((server) => {
      console.log(`Now running as ${getEnvURL()}`)
      return { server, db }
    })
    .catch(stop({ server, db }))
}

const stop = ({ server, db }) => (error) => {
  if (error) console.error(error)
  return stopServer(server)
    .then(() => disconnectDb(db))
    .then(() => ({ server, db }))
    .then(() => process.exit(error ? error.code || 1 : 0))
}

if (require.main === module) {
  start()
}
