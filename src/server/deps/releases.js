import { getGithubJson } from './github.js'
import os from 'os'

const repo = 'krachzack/fernspielapparat'
const releaseApiUrl = `/repos/${repo}/releases`

/**
 * Regexes that must match on the .tar.gz to be considered compatible
 * with the platform.
 */
const platformIndicatorsInTar = {
  darwin: /.*LDarwin.*\.tar\.gz/i,
  win32: /.*msys.*\.tar\.gz/i,
  // this matches fernspielapparat-0.2.0-linux-x86_64.tar.gz
  // but not fernspielapparat-0.2.0-arm-unknown-linux-gnueabihf.tar.gz
  // this does not work on RPi, where the other is needed.
  linux: /\.[0-9]+-linux-.*\.tar\.gz/i
}

/**
 * Finds the most recent release of the fernspielapparat runtime on GitHub
 * through the GitHub API.
 *
 * @returns {Promise<string>} URL to a `.tar.gz` with the fernspielapparat runtime
 */
export function releaseTarballUrl () {
  if (os.arch() !== 'x64') {
    return Promise.reject(
      new Error(`Architecture ${os.arch()} is not supported by the fernspielapparat runtime`)
    )
  }

  const platform = os.platform()
  if (!(platform in platformIndicatorsInTar)) {
    return Promise.reject(
      new Error(`OS ${os.platform()} is not supported by the fernspielapparat runtime`)
    )
  }

  return getGithubJson(releaseApiUrl)
    .then(newestRelease)
    .then(release => tarballForPlatform(
      release.assets,
      platform
    ))
}

function newestRelease (releases) {
  return releases.reduce(
    (acc, next) => {
      return (next.published_at > acc.published_at)
        ? next
        : acc
    },
    { published_at: '2000-01-01T00:00:00Z' }
  )
}

function tarballForPlatform (assets, platform) {
  const regex = platformIndicatorsInTar[platform]

  const asset = assets.find(
    asset => regex.exec(asset.name)
  )

  if (asset) {
    return asset.url
  } else {
    return Promise.reject(
      new Error(`Newest release has no tarball for platform ${platform}}`)
    )
  }
}
