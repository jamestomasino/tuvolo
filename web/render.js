const execSync = require('child_process').execSync
const fs = require('fs')
const path = require('path')
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

const rootFolder = './'
const sourceFileExt = '.md'

// Engine for simple variable replacement in views
const renderBasic = (options) => {
  const filePath = 'web/views/basic.wiki'
  const outputPath = 'web/public' + options.path
  console.log(outputPath)
  fs.readFile(filePath, function (err, content) {
    let s
    if (err) {
      console.log(err)
    }
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
            output += `<a href="./${line}.html">${line}</a><br>`
          }
        }
        rendered = rendered.replace('##' + s + '##', output)
      }
    }

    try {
      const folderPath = path.dirname(outputPath)
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true})
      }
      try {
        fs.writeFileSync(outputPath, rendered)
      } catch (err) {
        console.error(err)
      }
    } catch (err) {
      console.error(err)
    }
  })
}

// Try anything else as a markdown file or show error page
function request (stub) {
  try {
    const file = path.join(rootFolder, decodeURIComponent(stub)) + sourceFileExt
    const buffer = fs.readFileSync(file, { encoding: 'utf8' })
    const env = {}
    const dirty = md.render(buffer, env)
    const content = DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } })
    const title = 'The Last Call'
    renderBasic({ path: stub + '.html', title: title, content: content })
  } catch (_e) {
    const filePath = path.join(rootFolder, decodeURIComponent(stub))
    try {
      if (fs.statSync(filePath).isDirectory()) {
        // Special handling for the book folder. Show entire book at once.
        const filePath = path.join(rootFolder, decodeURIComponent(stub))
        const filesInDir = fs.readdirSync(filePath)
        if (stub === '/book/') {
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
            const filePath = path.join(rootFolder, decodeURIComponent(stub), decodeURIComponent(fileName))
            sum += '\n' + fs.readFileSync(filePath, { encoding: 'utf8' })
          }
          const env = {}
          const dirty = md.render(sum, env)
          allChapters += DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } })

          /* render it all */
          renderBasic({ path: stub + 'index.html', title: stub, content: allChapters })
        } else {
          // Otherwise, if the item is a directory: show all the items inside that directory.
          renderBasic({ path: stub + 'index.html', title: stub, content: filesInDir })
        }
      }
    } catch (_e) {
      console.log(_e)
    }
  }
}

[
  '/',
  '/book/',
  '/notes/'
].forEach(path => {
  request(path)
})

fs.readdir('notes/', function (err, files) {
    if (err) { return console.log('Unable to scan directory: ' + err); }
    files.forEach(stub => {
      request('/notes/' + path.parse(stub).name)
    })
})
