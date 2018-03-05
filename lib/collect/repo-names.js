require('dotenv-safe').load()

const fs = require('fs')
const path = require('path')
const got = require('got')
const mkdirp = require('mkdirp').sync
const URL = require('url')
const PER_PAGE = 100
const queue = new (require('bottleneck'))(4)

go('electron')

async function go (packageName) {
  const totalDeps = await getTotalDependentCount(packageName)
  const totalPages = Math.ceil(totalDeps / PER_PAGE)
  console.log(`Found ${totalDeps} repos that depend on ${packageName}\n`)
  for (let page = 1; page < totalPages; page++) {
    queue.schedule(getDependents, packageName, page)
  }
  queue.on('idle', done)
}

function done () {
  console.log('done creating repo directories')
}

async function getDependents (packageName, page) {
  const url = formatDependentsPageUrl(packageName, page)
  const resp = await got(url, {json: true})
  resp.body.forEach(repo => {
    const repoDir = path.join(__dirname, `../../repos/${repo.full_name}`)
    console.log(path.relative(process.cwd(), repoDir))
    mkdirp(repo.full_name)
  })
}

async function getTotalDependentCount (packageName) {
  let url = formatDependentsPageUrl(packageName, 1)
  const resp = await got(url, {json: true})
  return resp.headers.total
}

function formatDependentsPageUrl (packageName, page) {
  return URL.format({
    protocol: 'https:',
    host: 'libraries.io',
    pathname: `/api/npm/${packageName}/dependent_repositories/`,
    query: {
      api_key: process.env.LIBRARIES_IO_API_KEY,
      page: page,
      per_page: PER_PAGE
    }
  })
}
