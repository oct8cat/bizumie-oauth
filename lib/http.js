const express = require('express')
const { Passport } = require('passport')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const {
  db: { getUserModel },
  env: {
    getEnvGoogleClientID,
    getEnvGoogleClientSecret,
    getEnvGoogleCallbackURL
  },
  user: { createUserToken },
  error: { errRequired }
} = require('bizumie-common')

exports.createApp = ({ db }) => {
  const app = express()
  const passport = createPassport({ db })

  app.use('/:provider/callback', getToken({ passport }))
  app.use('/:provider', getCode({ passport }))
  app.use(handleError)

  return app
}

const createPassport = ({ db }) => {
  const passport = new Passport()

  passport.use(
    new GoogleStrategy(
      {
        clientID: getEnvGoogleClientID(),
        clientSecret: getEnvGoogleClientSecret(),
        callbackURL: getEnvGoogleCallbackURL(),
        scope: ['https://www.googleapis.com/auth/plus.me']
      },
      (token, refreshToken, profile, done) => {
        const { provider, id } = profile
        const oauth = { provider, id: id.toString() }
        const userModel = getUserModel(db)
        return userModel
          .findOne({ oauths: { $elemMatch: oauth } })
          .then((user) => {
            if (user) return user
            return userModel.create({
              oauths: [oauth],
              displayName: profile.displayName
            })
          })
          .then((user) => done(null, user))
          .catch(done)
      }
    )
  )

  return passport
}

const getToken = ({ passport }) => (req, res, next) => {
  const { query, params: { provider } } = req
  const state = query.state ? JSON.parse(query.state) : {}
  const { successURLTemplate } = state

  if (!successURLTemplate) {
    return next(errRequired('query.state.successURLTemplate'))
  }

  passport.authenticate(provider, { session: false })(req, res, () => {
    const token = createUserToken(req.user)
    const successURL = decodeURIComponent(successURLTemplate).replace(
      '{token}',
      token
    )
    res.redirect(successURL)
  })
}

const getCode = ({ passport }) => (req, res, next) => {
  const { query: { successURLTemplate }, params: { provider } } = req

  if (!successURLTemplate) {
    return next(errRequired('query.successURLTemplate'))
  }

  const state = JSON.stringify({
    successURLTemplate: encodeURIComponent(successURLTemplate)
  })
  passport.authenticate(provider, { session: false, state })(req, res, next)
}

const handleError = (error, req, res, next) => {
  if (error.message.match(/ERR_REQUIRED/)) {
    res.status(400).send({ error: error.message })
  } else {
    next(error)
  }
}
