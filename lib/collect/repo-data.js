require('dotenv-safe').load()

const repos = require('../all-repos')
const path = require('path')
const RateLimiter = require('limiter').RateLimiter
const limiter = new RateLimiter(4, 'second')
const Octokat = require('octokat')
const octo = new Octokat({token: process.env.GITHUB_ACCESS_TOKEN})
const NOW = new Date()
const TTL = 1000 * 60 * 60 * 24 * 7

console.log('Collecting repo metadata from the GitHub API')

repos.forEach(repo => {
  if (repo.status === 404) {
    return
  }

  if (repo.lastFetchedAt && NOW - new Date(repo.lastFetchedAt) < TTL) {
    console.log(`${repo.fullName} ${repo.status} (skipping; updated ${repo.lastFetchedAt})`)
    return
  }

  limiter.removeTokens(1, function () {
    const parts = path.basename(repo.filename, '.json').split('___')
    octo.repos(parts[0], parts[1]).fetch()
      .then(data => {
        Object.assign(repo, data, {status: 200, lastFetchedAt: new Date()})
        repo.save(`status: ${repo.status}`)
      })
      .catch(error => {
        // console.error(error)
        Object.assign(repo, {status: 404, lastFetchedAt: new Date()})
        repo.save(`status: ${repo.status}`)
      })
  })
})
