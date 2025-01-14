#!/usr/bin/env node

const { semver, error } = require('@vue/cli-shared-utils')
const filterPluginsByPlatform = require('../utils/filterPlugins')
const requiredVersion = require('../package.json').engines.node

if (!semver.satisfies(process.version, requiredVersion, { includePrerelease: true })) {
  error(
    `You are using Node ${process.version}, but mpx-cli-service ` +
    `requires Node ${requiredVersion}.\nPlease upgrade your Node version.`
  )
  process.exit(1)
}

const Service = require('../lib/Service')
const service = new Service(process.env.VUE_CLI_CONTEXT || process.cwd())
const rawArgv = process.argv.slice(2)
const args = require('minimist')(rawArgv, {
  boolean: [
    // build
    'modern',
    'report',
    'report-json',
    'inline-vue',
    'watch',
    // serve
    'open',
    'copy',
    'https',
    // inspect
    'verbose'
  ]
})
const command = args._[0]
process.env.MPX_CLI_MODE = command.split(':')[1] || 'mp'

const setPluginsToSkip = service.setPluginsToSkip.bind(service)
service.setPluginsToSkip = function (args) {
  setPluginsToSkip(args, rawArgv)
  let plugins = filterPluginsByPlatform(process.env.MPX_CLI_MODE)
  // 小程序模式下，将 @vue/cli-service 内置的 base 及 app 配置过滤掉
  if (process.env.MPX_CLI_MODE === 'mp') {
    plugins = plugins.concat([
      'built-in:config/base',
      'built-in:config/app',
      'built-in:config/css'
    ])
  }

  plugins.forEach(plugin => {
    this.pluginsToSkip.add(plugin)
  })
}

service.run(command, args, rawArgv).catch(err => {
  error(err)
  process.exit(1)
})
