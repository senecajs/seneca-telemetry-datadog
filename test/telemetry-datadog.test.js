const Seneca = require('seneca')

describe('github-provider', () => {
    test('happy', async () => {
      const seneca = Seneca({ legacy: false })
        .test()
      await seneca.ready()
    })
})
