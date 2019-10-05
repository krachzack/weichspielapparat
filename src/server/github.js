import { getJson, download } from './http.js'
import os from 'os'
import fs from 'fs'
import randomBetween from './rand.js'

const hostname = 'api.github.com'
const acceptJson = 'application/vnd.github.v3+json'
const acceptOctets = 'application/octet-stream'
const headersJson = {
  Accept: acceptJson,
  'User-Agent': 'Krachzack-Weichspielapparat'
}
const headersTarGz = {
  Accept: acceptOctets,
  'User-Agent': 'Krachzack-Weichspielapparat'
}

/**
 * Loads JSON from `https://api.github.com`. The part after the base URL
 * is accepted as a parameter and must start with a `/`, e.g.
 * `getGithubJson('/repos/krachzack/fernspielapparat/releases')`.
 *
 * @param {string} path relative path into `https://api.github.com`, starting with `/`
 * @returns {Promise<Object>} promise for JSON obtained from GitHub
 */
export function getGithubJson (path) {
  return getJson({ hostname, path, headers: headersJson })
    .then(processGithubJson)

  function processGithubJson ({ statusCode, json }) {
    if (statusCode >= 200 && statusCode < 300) {
      // Some successful status and not redirected
      return Promise.resolve(json)
    } else {
      // Either redirection or error, fail
      const msg = json.message
      return Promise.reject(
        new Error(
          `Request failed, got unsuccessful or redirection status: ${statusCode}, message: ${msg}`
        )
      )
    }
  }
}

export function downloadTarball (url, filename) {
  return createDownloadDirectory()
    .then(dir => download({ url, headers: headersTarGz }, `${dir}/${filename}`))
}

function createDownloadDirectory () {
  return new Promise((resolve, reject) => {
    const downloadDirectory = `${os.tmpdir()}/download-fernspielapparat-${randomBetween(0, 9999999)}`
    fs.mkdir(downloadDirectory, { recursive: false }, (err) => {
      if (err) {
        reject(err)
      } else {
        console.log(`downloading to ${downloadDirectory} ...`)
        resolve(downloadDirectory)
      }
    })
  })
}
