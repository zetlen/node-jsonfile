const path = require('path')
const assert = require('assert')
const { Volume, createFsFromVolume } = require('memfs')
const { JsonFile } = require('../')

/* global describe it beforeEach */

describe('+ readFile()', () => {
  const TEST_DIR = '/'
  let jf
  let fs

  beforeEach(() => {
    fs = createFsFromVolume(new Volume())
    jf = new JsonFile(fs)
  })

  it('should read and parse JSON', (done) => {
    const file = '/somefile.json'
    const obj = { name: 'JP' }
    fs.writeFileSync(file, JSON.stringify(obj))

    jf.readFile(file, (err, obj2) => {
      assert.ifError(err)
      assert.strictEqual(obj2.name, obj.name)
      done()
    })
  })

  it('should resolve a promise with parsed JSON', (done) => {
    const file = '/somefile.json'
    const obj = { name: 'JP' }
    fs.writeFileSync(file, JSON.stringify(obj))

    jf.readFile(file)
      .then((data) => {
        assert.strictEqual(data.name, obj.name)
        done()
      })
      .catch(err => {
        assert.ifError(err)
        done()
      })
  })

  describe('> when invalid JSON', () => {
    let fn, file

    beforeEach((done) => {
      fn = 'somefile.json'
      file = path.join(TEST_DIR, fn)
      fs.writeFileSync(file, '{')
      done()
    })

    it('should include the filename in the error', (done) => {
      jf.readFile(file, (err, obj2) => {
        assert(err instanceof Error)
        assert(err.message.match(fn))
        done()
      })
    })

    it('should reject the promise with filename in error', (done) => {
      jf.readFile(file)
        .catch(err => {
          assert(err instanceof Error)
          assert(err.message.match(fn))
          done()
        })
    })
  })

  describe('> when invalid JSON and throws set to false', () => {
    let fn, file

    beforeEach((done) => {
      fn = 'somefile4-invalid.json'
      file = path.join(TEST_DIR, fn)
      const data = '{not valid JSON'
      fs.writeFileSync(file, data)
      done()
    })

    it('should return null and no error', (done) => {
      let bothDone = false

      jf.readFile(file, (err, obj2) => {
        assert(err instanceof Error)
        assert(err.message.match(fn))
        if (bothDone) {
          done()
        }
        bothDone = true
      })

      jf.readFile(file, { throws: false }, (err, obj2) => {
        assert.ifError(err)
        assert.strictEqual(obj2, null)
        if (bothDone) {
          done()
        }
        bothDone = true
      })
    })

    it('should resolve the promise with null as data', (done) => {
      jf.readFile(file, { throws: false })
        .then(data => {
          assert.strictEqual(data, null)
          done()
        })
        .catch(err => {
          assert.ifError(err)
          done()
        })
    })
  })

  describe('> when invalid JSON and throws set to true', () => {
    let fn, file

    beforeEach((done) => {
      fn = 'somefile4-invalid.json'
      file = path.join(TEST_DIR, fn)
      const data = '{not valid JSON'
      fs.writeFileSync(file, data)
      done()
    })

    it('should return an error', (done) => {
      let bothDone = false
      jf.readFile(file, (err, obj2) => {
        assert(err instanceof Error)
        assert(err.message.match(fn))
        if (bothDone) {
          done()
        }
        bothDone = true
      })

      jf.readFile(file, { throws: true }, (err, obj2) => {
        assert(err instanceof Error)
        assert(err.message.match(fn))
        if (bothDone) {
          done()
        }
        bothDone = true
      })
    })

    it('should reject the promise', (done) => {
      jf.readFile(file, { throws: true })
        .catch(err => {
          assert(err instanceof Error)
          assert(err.message.match(fn))
          done()
        })
    })
  })

  describe('> when JSON reviver is set', () => {
    let file, sillyReviver

    beforeEach((done) => {
      file = '/somefile.json'
      sillyReviver = function (k, v) {
        if (typeof v !== 'string') return v
        if (v.indexOf('date:') < 0) return v
        return new Date(v.split('date:')[1])
      }

      const obj = { name: 'jp', day: 'date:2015-06-19T11:41:26.815Z' }

      fs.writeFileSync(file, JSON.stringify(obj))
      done()
    })

    it('should transform the JSON', (done) => {
      jf.readFile(file, { reviver: sillyReviver }, (err, data) => {
        assert.ifError(err)
        assert.strictEqual(data.name, 'jp')
        assert(data.day instanceof Date)
        assert.strictEqual(data.day.toISOString(), '2015-06-19T11:41:26.815Z')
        done()
      })
    })

    it('should resolve the promise with transformed JSON', (done) => {
      jf.readFile(file, { reviver: sillyReviver })
        .then(data => {
          assert.strictEqual(data.name, 'jp')
          assert(data.day instanceof Date)
          assert.strictEqual(data.day.toISOString(), '2015-06-19T11:41:26.815Z')
          done()
        }).catch(err => {
          assert.ifError(err)
          done()
        })
    })
  })

  describe('> when passing null as options and callback', () => {
    it('should not throw an error', (done) => {
      const file = '/somefile.json'

      const obj = {
        name: 'jp'
      }
      fs.writeFileSync(file, JSON.stringify(obj))

      jf.readFile(file, null, (err) => {
        assert.ifError(err)
        assert.strictEqual(obj.name, 'jp')
        done()
      })
    })
  })

  describe('> when passing null as options and expecting a promise', () => {
    it('should resolve the promise', (done) => {
      const file = '/somefile.json'

      const obj = {
        name: 'jp'
      }
      fs.writeFileSync(file, JSON.stringify(obj))

      jf.readFile(file, null)
        .then(data => {
          assert.strictEqual(data.name, obj.name)
          done()
        })
        .catch(err => {
          assert.ifError(err)
          done()
        })
    })
  })

  describe('> when passing encoding string as option', () => {
    let file, obj

    beforeEach((done) => {
      file = '/somefile.json'

      obj = {
        name: 'jp'
      }
      fs.writeFileSync(file, JSON.stringify(obj))
      done()
    })

    it('should not throw an error', (done) => {
      jf.readFile(file, 'utf8', (err) => {
        assert.ifError(err)
        assert.strictEqual(obj.name, 'jp')
        done()
      })
    })

    it('should resolve the promise', (done) => {
      jf.readFile(file, 'utf8')
        .then(data => {
          assert.strictEqual(data.name, obj.name)
          done()
        })
        .catch(err => {
          assert.ifError(err)
          done()
        })
    })
  })

  describe('> w/ BOM', () => {
    let file, obj

    beforeEach((done) => {
      file = '/file-bom.json'
      obj = { name: 'JP' }
      fs.writeFileSync(file, `\uFEFF${JSON.stringify(obj)}`)
      done()
    })

    it('should properly parse', (done) => {
      jf.readFile(file, (err, data) => {
        assert.ifError(err)
        assert.deepStrictEqual(obj, data)
        done()
      })
    })

    it('should resolve the promise with parsed JSON', (done) => {
      jf.readFile(file)
        .then(data => {
          assert.deepStrictEqual(data, obj)
          done()
        })
        .catch(err => {
          assert.ifError(err)
          done()
        })
    })
  })
})
