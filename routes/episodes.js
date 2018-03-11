var express = require('express')
var router = express.Router()
var request = require('request')

const _randomTrueFalse = () => Math.random() < 0.5
const _dateIn12Hours = () => {
  const currentDate = new Date()
  currentDate.setHours(currentDate.getHours() + 12)
  return currentDate
}

let jsWebToken = {
  bearerToken: process.env.START_TOKEN,
  expirationDate: _dateIn12Hours()
}

let firstPage = _randomTrueFalse()

const _getPage = () => {
  // switch firstPage to avoid providing same episode twice...
  firstPage = !firstPage
  // ... but still returns the correct number since it's random anyway
  return firstPage ? 1 : 2
}

const _randomElementFromArray = sourceArray => sourceArray[Math.floor(Math.random() * sourceArray.length)]

router.get('/random/', function (req, res, next) {
  if (jsWebToken.expirationDate.getTime() >= new Date().getTime()) {
    request.get('https://api.thetvdb.com/refresh_token', {
      'auth': {
        'bearer': jsWebToken.bearerToken
      }
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        jsWebToken = {
          bearerToken: JSON.parse(body).token,
          expirationDate: _dateIn12Hours()
        }
      }
    })
  }
  request.get('https://api.thetvdb.com/series/76846/episodes/query?page=' + _getPage(), {
    'auth': {
      'bearer': jsWebToken.bearerToken
    },
    headers: {
      'Accept-Language': 'DE'
    }
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const randomEpisode = _randomElementFromArray(JSON.parse(body).data.filter(arrayElement => arrayElement.episodeName))
      res.send(
        {
          name: randomEpisode.episodeName,
          description: randomEpisode.overview,
          season: randomEpisode.dvdSeason,
          sequenceNumber: randomEpisode.dvdEpisodeNumber
        }
      )
    }
  })
})

module.exports = router
