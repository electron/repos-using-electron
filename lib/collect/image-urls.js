require('dotenv').load()

const MAX_CONCURRENCY = 4

const repoImages = require('repo-images')
const path = require('path')
const fs = require('fs')
const repos = require('../../')
const mkdirp = require('mkdirp').sync
const queue = new (require('bottleneck'))(MAX_CONCURRENCY)
const pathIsFresh = require('path-is-fresh')

const staleRepos = repos
  .sort((a, b) => b.stargazersCount - a.stargazersCount)
  .filter(repo => !pathIsFresh(repo.imagesFile, '1 week'))

console.log(`Found ${staleRepos.length} repos with stale image data out of ${repos.length} total`)

staleRepos.forEach(repo => queue.schedule(getImages, repo))

queue.on('idle', done)

async function getImages (repo) {
  let images = []
  try {
    images = await repoImages(repo.fullName)
  } catch (err) {
    if (err.statusCode !== 404) {
      console.error(`error fetching ${repo.fullName}`)
      console.error(err)
    }
    return
  }
  
  images = images
    .filter(image => image.path.match(/icon/i))
    .filter(image => image.path.match(/png/i))
    .map(image => image.rawgit)

  console.log(path.relative(process.cwd(), repo.imagesFile))
  mkdirp(repo.dir)
  fs.writeFileSync(repo.imagesFile, JSON.stringify(images, null, 2))
}

function done () {
  console.log('done')
}