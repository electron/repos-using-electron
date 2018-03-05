#!/usr/bin/env node
const assert = require('assert')

const featureableApps = require('../lib/featureable-apps')
const repos = require('..')
const fs = require('fs-extra')
const path = require('path')
const slugify = require('slugg')
const cleanDeep = require('clean-deep')
const mkdirp = require('mkdirp').sync
const yaml = require('yamljs')
const blacklist = [
  'brave',
  'webtorrent',
  'webtorrent-desktop'
]

const electronAppsBasedir = process.argv.slice(2)[0]
assert(electronAppsBasedir, 'specify the full path to your local electron-apps repo')
assert(fs.existsSync(electronAppsBasedir), 'specified electron-apps repo dir does not exist')

featureableApps.forEach(app => {
  const repo = repos.find(repo => repo.fullName === app.repo)

  if (!repo || !repo.packageJSON) return

  const appData = cleanDeep({
    name: repo.packageJSON.name,
    description: repo.packageJSON.description,
    repository: `https://github.com/${repo.fullName}`,
    website: repo.packageJSON.homepage,
    keywords: repo.packageJSON.keywords,
    license: repo.packageJSON.license,
    category: 'Productivity'
  })

  if (!appData.name) return

  const slug = slugify(appData.name) 

  if (blacklist.includes(slug)) return

  const appPath = path.join(electronAppsBasedir, 'apps', slug)
  const ymlPath = path.join(electronAppsBasedir, 'apps', slug, `${slug}.yml`)
  const iconPath = path.join(electronAppsBasedir, 'apps', slug, `${slug}-icon.png`)

  if (fs.existsSync(appPath)) return
  
  console.log('\n\n')
  console.log(appPath)
  console.log(ymlPath)
  console.log(iconPath)
  console.log(appData)
  mkdirp(appPath)
  fs.copySync(app.iconFullpath, iconPath)
  fs.writeFileSync(ymlPath, yaml.stringify(appData, 2))
})