const dotenv = require('dotenv')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

const pjson = require('../package.json')
const version = pjson.version

function _log(message) {
  console.log(`[dotenv-vault-core@${version}][INFO] ${message}`)
}

function _warn(message) {
  console.log(`[dotenv-vault-core@${version}][WARN] ${message}`)
}

function _debug(message) {
  console.log(`[dotenv-vault-core@${version}][DEBUG] ${message}`)
}

function _dotenvKey() {
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    return process.env.DOTENV_KEY
  }

  return ''
}

function _likelyDeployedEnvironment() {
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'development') {
    return false
  }

  if (nodeEnv === 'test') {
    return false
  }

  if (nodeEnv === '') {
    return false
  }

  if (nodeEnv === undefined) {
    return false
  }

  if (nodeEnv === null) {
    return false
  }

  return true
}

function _vaultPath(options) {
  let dotenvPath = path.resolve(process.cwd(), '.env')

  if (options && options.path && options.path.length > 0) {
    dotenvPath = options.path
  }

  // Locate .env.vault
  return dotenvPath.endsWith('.vault') ? dotenvPath : `${dotenvPath}.vault`
}

function decrypt(encrypted, keyStr) {
  const key = Buffer.from(keyStr.slice(-64), 'hex')
  let ciphertext = Buffer.from(encrypted, 'base64')

  const nonce = ciphertext.slice(0, 12)
  const authTag = ciphertext.slice(-16)
  ciphertext = ciphertext.slice(12, -16)

  try {
    const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce)
    aesgcm.setAuthTag(authTag)
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`
  } catch (error) {
    const isRange = error instanceof RangeError
    const decryptionFailed = error.message === 'Unsupported state or unable to authenticate data'

    if (isRange) {
      const msg = 'INVALID_DOTENV_KEY: It must be 64 characters long (or more)'
      throw new Error(msg)
    } else if (decryptionFailed) {
      const msg = 'DECRYPTION_FAILED: Please check your DOTENV_KEY'
      throw new Error(msg)
    } else {
      throw error
    }
  }
}

function _instructions(result, dotenvKey) {
  // Parse DOTENV_KEY. Format is a URI
  const uri = new URL(dotenvKey)

  // Get decrypt key
  const key = uri.password
  if (!key) {
    throw new Error('INVALID_DOTENV_KEY: Missing key part')
  }

  // Get environment
  const environment = uri.searchParams.get('environment')
  if (!environment) {
    throw new Error('INVALID_DOTENV_KEY: Missing environment part')
  }

  // Get ciphertext payload
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`
  const ciphertext = result.parsed[environmentKey] // DOTENV_VAULT_PRODUCTION
  if (!ciphertext) {
    throw new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file. Run 'npx dotenv-vault build' to include it.`)
  }

  return {ciphertext, key}
}

function parseVault(options) {
  const vaultPath = _vaultPath(options)

  // Parse .env.vault
  const result = dotenv.config({path: vaultPath})
  if (!result.parsed) {
    throw new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`)
  }

  // handle scenario for comma separated keys - for use with key rotation
  // example: DOTENV_KEY="dotenv://:key_1234@dotenv.org/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenv.org/vault/.env.vault?environment=prod"
  const keys = _dotenvKey().split(',')
  const length = keys.length

  let decrypted
  for (let i = 0; i < length; i++) {
    try {
      // Get full key
      const key = keys[i].trim()

      // Get instructions for decrypt
      const attrs = _instructions(result, key)

      // Decrypt
      decrypted = decrypt(attrs.ciphertext, attrs.key)

      break
    } catch (error) {
      // last key
      if (i + 1 >= length) {
        throw error
      }
      // try next key
    }
  }

  // Parse decrypted .env string
  return dotenv.parse(decrypted)
}

function configVault(options) {
  _log('Loading env from encrypted .env.vault')

  const parsed = parseVault(options)

  const debug = Boolean(options && options.debug)
  const override = Boolean(options && options.override)

  // Set process.env
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(process.env, key)) {
      if (override === true) {
        process.env[key] = parsed[key]
      }

      if (debug) {
        if (override === true) {
          _debug(`"${key}" is already defined in \`process.env\` and WAS overwritten`)
        } else {
          _debug(`"${key}" is already defined in \`process.env\` and was NOT overwritten`)
        }
      }
    } else {
      process.env[key] = parsed[key]
    }
  }

  return {parsed}
}

function config(options) {
  const vaultPath = _vaultPath(options)

  // fallback to original dotenv if DOTENV_KEY is not set
  if (_dotenvKey().length === 0) {
    if (_likelyDeployedEnvironment()) {
      _log(`You are using dotenv-vault in ${process.env.NODE_ENV}, but you haven't set a DOTENV_KEY. Did you forget? Run 'npx dotenv-vault keys' to view your DOTENV_KEY.`)
    }

    // _log('Loading env from .env')

    return dotenv.config(options)
  }

  // dotenvKey exists but .env.vault file does not exist
  if (!fs.existsSync(vaultPath)) {
    _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it? Run 'npx dotenv-vault build'.`)

    return dotenv.config(options)
  }

  return configVault(options)
}

module.exports = { config: config, decrypt: decrypt }
