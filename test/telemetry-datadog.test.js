const Seneca = require('seneca')

describe('telemetry-datadog', () => {
    test('happy', async () => {
      const seneca = Seneca({ legacy: false })
        .test()
      await seneca.ready()
    })
})
