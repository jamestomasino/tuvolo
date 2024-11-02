const serverless = require('serverless-http')
const express = require('express')
const execSync = require('child_process').execSync
const fs = require('fs')
const path = require('path')
const findInFiles = require('find-in-files')
const createDOMPurify = require('dompurify')
const { JSDOM } = require('jsdom')
const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)
const md = require('markdown-it')({
    html:true, typographer:true
  })
  .use(require('markdown-it-anchor'))
  .use(require('markdown-it-toc-done-right'), {
    containerClass: 'toc',
    level: [2],
  })
  .use(require('markdown-it-title'))
  .use(require('markdown-it-underline'))

const rootURL = 'https://localhost:3000/'
const rootFolder = './'
const sourceFileExt = '.md'
const app = express()
const port = 3000

// Engine for simple variable replacement in views
app.engine('wiki', function (filePath, options, callback) {
  fs.readFile(filePath, function (err, content) {
    let s
    if (err) return callback(err)
    let rendered = content.toString()
    for (s in options) {
      if (typeof options[s] === 'string') {
        rendered = rendered.replace('##' + s + '##', options[s])
      }
      if (typeof options[s] === 'object') {
        // File listing
        let output = ''
        for (const key in options[s]) {
          let line = options[s][key]
          if (typeof line === 'string' && line.endsWith('.md')) {
            line = line.substr(0, line.length - 3)
          }
          if (typeof line === 'string' && !line.startsWith('.') && line !== 'web' && line !== 'Makefile') {
            output += `<a href="./${line}">${line}</a><br>`
          }
        }
        rendered = rendered.replace('##' + s + '##', output)
      }
    }
    return callback(null, rendered)
  })
})

// Set up paths to views
app.set('views', './web/views')
app.set('view engine', 'wiki')

// Any link to a direct static resource will show it
app.use(express.static(path.join(__dirname, '/static')))

// Any other content directly linked will show as-is
app.use(express.static(rootFolder))

// Try anything else as a markdown file or show error page
app.get('*', function(req, res){
  const fullUrl = rootURL + req.originalUrl
  try {
    const file = path.join(rootFolder, decodeURIComponent(req.path)) + sourceFileExt
    const buffer = fs.readFileSync(file, { encoding: 'utf8' })
    const env = {}
    const dirty = md.render(buffer, env)
    const content = DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } })
    const title = 'Hierophant'
    res.render('basic', { title: title, content: content, canonical: fullUrl})
  } catch (_e) {
    const filePath = path.join(rootFolder, decodeURIComponent(req.path))
    try {
      if (fs.statSync(filePath).isDirectory()) {
        // Special handling for the book folder. Show entire book at once.
        const filePath = path.join(rootFolder, decodeURIComponent(req.path))
        const filesInDir = fs.readdirSync(filePath)
        if (req.path === '/book/') {
          let allChapters = ''

          /* Add wordcount */
          const wordcount = execSync('find ./book -type f -exec cat {} + | wc -w')
          allChapters += '<div class="wordcount">Word Count: ' + parseInt(wordcount, 10).toLocaleString("en-US") + '</div>'

          /* add category/genre */
          const catgenre = '<div class="category">Adult<br>Fantasy</div>'
          allChapters += catgenre

          /* add all chapters into 1 long scroll */
          let sum = ''
          for (const f in filesInDir) {
            const fileName = filesInDir[f]
            const filePath = path.join(rootFolder, decodeURIComponent(req.path), decodeURIComponent(fileName))
            sum += '\n' + fs.readFileSync(filePath, { encoding: 'utf8' })
          }
          const env = {}
          const dirty = md.render(sum, env)
          allChapters += DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } })

          /* render it all */
          res.render('basic', { title: req.path, content: allChapters, canonical: fullUrl})
        } else {
          // Otherwise, if the item is a directory: show all the items inside that directory.
          res.render('basic', { title: req.path, content: filesInDir, canonical: fullUrl})
        }
      }
    } catch (_e) {
      const back = '<a href="/">&lt;&lt; BACK TO HOME</a>'
      const error = '<p>Entry not found. Please try again.</p>'
      const content = back + '<br><br>' + error
      res.status(404)
      res.render('basic', { title: 'Error: Content not found', content: content, canonical: fullUrl})
    }
  }
})

module.exports.handler = serverless(app);
// app.listen(port, () => console.log(`listening on port ${port}!`))
