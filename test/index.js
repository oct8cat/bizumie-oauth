/* eslint-env mocha */

const assert = require('assert')
const supertest = require('supertest')
const { db: { createDb } } = require('bizumie-common')
const { http: { createApp } } = require('..')

const db = createDb()
const app = createApp({ db })
const successURLTemplate = 'http://example.com/token/{token}'

describe('/:provider', () => {
  it('Requires query.successURLTemplate', () => {
    return supertest(app)
      .get('/google')
      .expect(400)
      .then(({ body: { error } }) => {
        assert.ok(error.match(/ERR_REQUIRED.*successURLTemplate/))
      })
  })
  it('Redirects to provider on valid input', () => {
    return supertest(app)
      .get(`/google?successURLTemplate=${successURLTemplate}`)
      .expect(302)
      .then((res) =>
        assert.ok(res.headers.location.match(/accounts\.google\.com/))
      )
  })
})
describe('/:provider/callback', () => {
  it('Requires query.state.successURLTemplate', () => {
    return supertest(app)
      .get(`/google/callback`)
      .expect(400)
      .then(({ body: { error } }) => {
        assert.ok(error.match(/ERR_REQUIRED.*successURLTemplate/))
      })
  })
})
