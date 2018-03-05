require('dotenv-safe').load()

const repos = require('../all-repos')
const path = require('path')
const limiter = new RateLimiter(Math.floor(5000 / 60 / 60), 'second')
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
        console.error(error)
        Object.assign(repo, {status: 404, lastFetchedAt: new Date()})
        repo.save(`status: ${repo.status}`)
      })
  })
})



const staleRepos = repos
  .sort((a, b) => b.stargazersCount - a.stargazersCount)
  .filter(repo => !pathIsFresh(repo.dataFile, '1 week'))

console.log(`Found ${staleRepos.length} repos with stale data out of ${repos.length} total`)

staleRepos.forEach(repo => queue.schedule(getData, repo))

queue.on('idle', done)

async function getData (repo) {
let images = []
try {
  images = await repoImages(repo.fullName)
} catch (err) {
  if (err.statusCode !== 404) {
    console.error(`error fetching ${repo.fullName}`)
    console.error(err)
  }
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