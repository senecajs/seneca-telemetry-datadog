![Seneca Gateway](http://senecajs.org/files/assets/seneca-logo.png)

> _Seneca Gateway_ is a plugin for [Seneca](http://senecajs.org)

Handle incoming messages within other frameworks.

[![npm version](https://img.shields.io/npm/v/@seneca/gateway.svg)](https://npmjs.com/package/@seneca/gateway)
[![build](https://github.com/senecajs/seneca-gateway/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-gateway/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/senecajs/seneca-gateway/badge.svg?branch=main)](https://coveralls.io/github/senecajs/seneca-gateway?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-gateway/badge.svg)](https://snyk.io/test/github/senecajs/seneca-gateway)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/19453/branches/505563/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=19453&bid=505563)
[![Maintainability](https://api.codeclimate.com/v1/badges/9d54b38a991fe7b92a43/maintainability)](https://codeclimate.com/github/senecajs/seneca-gateway/maintainability)

# @seneca/gateway

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- |

## Notice

This piece of software is currently at the prototype stage, which means, among other things, that its API can be unstable,
and the software - buggy. For the duration of the prototype stage, we will also be using some auxiliary packages such as
`assert-plus` and `fetch-prop` - that are expected to help catch bugs.


## Install

- Install and enable the `datadog-agent` daemon from the Datadog website
- Install the `dd-trace` package
- Initialize the `dd-trace` package in your project
- Install this plugin
- Use this plugin with your Seneca instance, IMPORTANT - wrap your `dd-trace` in a function and pass to the plugin via the `getTracer` option:
```javascript
const DdTrace = require('dd-trace')
const Seneca = require('seneca')

const seneca = Seneca()
const tracer = DdTrace.init()

seneca.use(require('seneca-telemetry-datadog'), {
	getTracer: () => tracer
})
```


## Quick Example

## More Examples

## Motivation

## Support

## API

## Contributing

## Background
