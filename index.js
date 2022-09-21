const express = require('express');
const mongo = require('mongodb')
const mongoose = require('mongoose')
const cors = require('cors');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const validUrl = require('valid-url')
const app = express();
require("dotenv").config();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(cors());
app.use(express.json())
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const uri = process.env.MONGO_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
});
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error'));
connection.once('open', () => {
  console.log('database connection established')
})

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
})
const URL = mongoose.model('URL', urlSchema)

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  console.log(req.body);
  const url = req.body.url
  const urlCode = shortid.generate()

  console.log(`valid: ${validUrl.isWebUri(url)}`);

  if (!validUrl.isWebUri(url)) {
    res.json({
      error: 'invalid url'
    })
  } else {
    try {
      let findOne = await URL.findOne({
        original_url: url
      })

      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        findOne = new URL({
          original_url: url,
          short_url: urlCode
        })

        await findOne.save()

        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url,
        });
      }
    } catch (err) {
      console.error(err)
      res.status(500).json('Server error...')
    }
  }
})

app.get('/api/shorturl/:short_url?', async (req, res) => {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if (urlParams) {
      return res.redirect(urlParams.original_url)
    } else {
      res.status(404).json('No URL found')
    }
  } catch (err) {
    console.log(err)
    res.status(500).json('Server error')
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
