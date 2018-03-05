'use strict'

const fs = require('fs')
const path = require('path')
const Package = require('nice-package')

module.exports = class Repo {
  constructor (props) {
    Object.assign(this, props)

    if (this.packageJSON) {
      this.packageJSON = new Package(this.packageJSON)
    }

    return this
  }

  save (reason) {
    fs.writeFileSync(
      path.join(__dirname, `../repos/${this.filename}`),
      JSON.stringify(this, null, 2)
    )
    console.log(`${this.fullName}${reason ? ` (${reason})` : ``}`)
  }

  get dir () {
    return path.join(__dirname, `../repos/${this.fullName}`)
  }

  get dataFile () {
    return path.join(this.dir, 'data.json')
  }

  get imagesFile () {
    return path.join(this.dir, 'images.json')
  }

  get formerFork () {
    return this.fork || !!this.sourceRepo
  }

  get valid () {
    return this.status === 200 &&
    this.packageStatus === 200 &&
    this.fullName &&
    this.fullName.length &&
    this.firstCommit &&
    this.name &&
    this.name.length &&
    // Array.isArray(this.contributors) &&
    this.pkg &&
    (this.pkg.somehowDependsOn('electron') || this.pkg.somehowDependsOn('electron-prebuilt'))
  }

  get pkg () {
    return this.packageJSON
  }
}
