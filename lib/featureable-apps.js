const walk = require('walk-sync')
const imageSize = require('image-size')
const path = require('path')
const imagesPath = path.join(__dirname, '../images')
const {chain} = require('lodash')
const parseRepoUrl = require('github-url-to-object')
const electronAppsVersion = require('electron-apps/package.json').version
const existingRepos = chain(require('electron-apps'))
  .map(app => {
    const parts = parseRepoUrl(app.repository) || parseRepoUrl(app.website)
    return parts ? [parts.user, parts.repo].join('/') : null
  })
  .compact()
  .value()

console.log(`Found ${existingRepos.length} existing apps with GitHub repos in electron-apps v${electronAppsVersion}`)

const finalists = []
const featureable = chain(walk(imagesPath))
  .filter(filename => filename.toLowerCase().endsWith('.png'))
  .map(filename => {
    const fullpath = path.join(imagesPath, filename)
    const {width, height} = imageSize(fullpath)
    return Object.assign({
      iconFilename: filename, 
      iconFullpath: fullpath,
      repo: filename.split('/')[0].split('___').join('/'),
      width: width,
      height: height
    })
  })
  .filter(image => !existingRepos.includes(image.repo))
  .filter(image => image.width === image.height)
  .filter(image => image.width >= 128)
  .orderBy('width', 'desc')
  .reduce((acc, image) => {
    // pick the largest image from the given repo
    if (!finalists.includes(image.repo)) {
      acc.push(image)
      finalists.push(image.repo)
    }
    return acc
  }, [])
  .value()

module.exports = featureable