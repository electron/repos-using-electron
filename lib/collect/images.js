require('dotenv').load()

const repoImages = require('repo-images')
const async = require('async')
const path = require('path')
const fs = require('fs')
const RateLimiter = require('limiter').RateLimiter
const ghLimiter = new RateLimiter(5000, 'hour')
const downloadLimiter = new RateLimiter(3, 'second')
const flatten = require('lodash.flatten')
const download = require('download')
const mkdirp = require('mkdirp')

const repoNames = require('../../')
  .sort((a, b) => b.stargazersCount - a.stargazersCount)
  .slice(49, 100)
  .map(repo => repo.fullName)

async.map(repoNames, getImages, done)

function getImages (repoName, callback) {
  ghLimiter.removeTokens(1, () => {
    repoImages(repoName)
      .then(images => {
        const urls = images
          .filter(image => image.path.match(/icon/i))
          .filter(image => image.path.match(/png/i))
          .map(image => {
            return {
              repo: repoName,
              url: image.rawgit
            }
          })
        console.log(`${repoName}: ${urls.length}`)
        return callback(null, urls)
      })
      .catch(err => {
        console.error(`${repoName} failed`)
        console.error(err)
      })
  })
}

function done (err, data) {
  console.log('done fetching image URLs')
  if (err) throw err

  flatten(data).forEach(image => {
    downloadLimiter.removeTokens(1, () => {
      const basepath = path.join(__dirname, `../../images/${image.repo.replace('/', '___')}`)
      const filename = path.join(basepath, path.basename(image.url))

      if (fs.existsSync(filename)) {
        console.log(`${filename} already exists; skipping`)
        return
      }

      console.log(`downloading ${image.url}`)
      mkdirp(basepath)
      download(image.url, basepath)
    })
  })

  console.log('done!')
}
