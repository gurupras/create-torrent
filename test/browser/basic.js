/* global Blob */

const fixtures = require('webtorrent-fixtures')
const fs = require('fs')
const parseTorrent = require('parse-torrent')
const path = require('path')
const sha1 = require('simple-sha1')
const test = require('tape')
const createTorrent = require('../../')

function makeFileShim (buf, name) {
  const file = new Blob([ buf ])
  file.fullPath = `/${name}`
  file.name = name
  return file
}

const leaves = makeFileShim(fixtures.leaves.content, 'Leaves of Grass by Walt Whitman.epub')

const numbers1 = makeFileShim(fs.readFileSync(path.join(__dirname, '../../node_modules/webtorrent-fixtures/fixtures/numbers/1.txt'), 'utf8'), '1.txt')
const numbers2 = makeFileShim(fs.readFileSync(path.join(__dirname, '../../node_modules/webtorrent-fixtures/fixtures/numbers/2.txt'), 'utf8'), '2.txt')
const numbers3 = makeFileShim(fs.readFileSync(path.join(__dirname, '../../node_modules/webtorrent-fixtures/fixtures/numbers/3.txt'), 'utf8'), '3.txt')

test('create single file torrent', t => {
  t.plan(11)

  const startTime = Date.now()
  createTorrent(leaves, (err, torrent) => {
    t.error(err)

    const parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'Leaves of Grass by Walt Whitman.epub')

    t.notOk(parsedTorrent.private)

    t.ok(parsedTorrent.created.getTime() >= startTime, 'created time is after start time')

    t.ok(Array.isArray(parsedTorrent.announce))

    t.equals(parsedTorrent.files[0].path, 'Leaves of Grass by Walt Whitman.epub')
    t.equals(parsedTorrent.files[0].length, 362017)

    t.equal(parsedTorrent.length, 362017)
    t.equal(parsedTorrent.pieceLength, 16384)

    t.deepEquals(parsedTorrent.pieces, [
      '1f9c3f59beec079715ec53324bde8569e4a0b4eb',
      'ec42307d4ce5557b5d3964c5ef55d354cf4a6ecc',
      '7bf1bcaf79d11fa5e0be06593c8faafc0c2ba2cf',
      '76d71c5b01526b23007f9e9929beafc5151e6511',
      '0931a1b44c21bf1e68b9138f90495e690dbc55f5',
      '72e4c2944cbacf26e6b3ae8a7229d88aafa05f61',
      'eaae6abf3f07cb6db9677cc6aded4dd3985e4586',
      '27567fa7639f065f71b18954304aca6366729e0b',
      '4773d77ae80caa96a524804dfe4b9bd3deaef999',
      'c9dd51027467519d5eb2561ae2cc01467de5f643',
      '0a60bcba24797692efa8770d23df0a830d91cb35',
      'b3407a88baa0590dc8c9aa6a120f274367dcd867',
      'e88e8338c572a06e3c801b29f519df532b3e76f6',
      '70cf6aee53107f3d39378483f69cf80fa568b1ea',
      'c53b506159e988d8bc16922d125d77d803d652c3',
      'ca3070c16eed9172ab506d20e522ea3f1ab674b3',
      'f923d76fe8f44ff32e372c3b376564c6fb5f0dbe',
      '52164f03629fd1322636babb2c014b7dae582da4',
      '1363965261e6ce12b43701f0a8c9ed1520a70eba',
      '004400a267765f6d3dd5c7beb5bd3c75f3df2a54',
      '560a61801147fa4ec7cf568e703acb04e5610a4d',
      '56dcc242d03293e9446cf5e457d8eb3d9588fd90',
      'c698de9b0dad92980906c026d8c1408fa08fe4ec'
    ])

    window.parsedTorrent = parsedTorrent
    t.equals(sha1.sync(parsedTorrent.infoBuffer), 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36')
  })
})

test('create multi file torrent', t => {
  t.plan(16)

  const startTime = Date.now()
  createTorrent([ numbers1, numbers2, numbers3 ], {
    // force piece length to 32KB so info-hash will
    // match what transmission generated, since we use
    // a different algo for picking piece length
    pieceLength: 32768,

    private: false, // also force `private: false` to match transmission
    name: 'numbers'

  }, (err, torrent) => {
    t.error(err)

    const parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'numbers')

    t.notOk(parsedTorrent.private)

    t.ok(parsedTorrent.created.getTime() >= startTime, 'created time is after start time')

    t.ok(Array.isArray(parsedTorrent.announce))

    t.deepEquals(parsedTorrent.files[0].path, 'numbers/1.txt')
    t.deepEquals(parsedTorrent.files[0].length, 1)

    t.deepEquals(parsedTorrent.files[1].path, 'numbers/2.txt')
    t.deepEquals(parsedTorrent.files[1].length, 2)

    t.deepEquals(parsedTorrent.files[2].path, 'numbers/3.txt')
    t.deepEquals(parsedTorrent.files[2].length, 3)

    t.equal(parsedTorrent.length, 6)
    t.equal(parsedTorrent.info.pieces.length, 20)
    t.equal(parsedTorrent.pieceLength, 32768)

    t.deepEquals(parsedTorrent.pieces, [
      '1f74648e50a6a6708ec54ab327a163d5536b7ced'
    ])

    t.equals(sha1.sync(parsedTorrent.infoBuffer), '80562f38656b385ea78959010e51a2cc9db41ea0')
  })
})
