var path = require('path');
var invariant = require('invariant');
var EventStream = require('event-stream');
var JSONStream = require('JSONStream');
var serializer = require('min-document/serialize');
var h = require('virtual-dom/h');
var createElement = require('virtual-dom/vdom/create-element');
var Document = require('min-document/document');

var renderers = {
  embed: renderEmbedded,
  fullscreen: renderFullscreen,
}

function getDefaultExports(file) {
  var moduleExports = require(file)

  // Return exports.default if using ES2015 modules.
  if (moduleExports && moduleExports.default)
    return moduleExports.default

  return moduleExports
}

function renderEmbedded(Elm, request, callback) {
  var div = h('div', {id: request.id});
  var elem = createElement(div);

  Elm[request.component].embed(elem, request.data);

  callback(null, serializer(elem));
}

function renderFullscreen(Elm, request, callback) {
  Elm[request.component].fullscreen(request.data);
  callback(null, serializer(document.body));
}

// The request json object
// path: - The path to the file that contains Elm
// component: - The component name to render
// render: The rendering method. "fullscreen" or "embedded"
// id: - The id of the element for embed rendering
// data: - The data attributes to pass to elm
function handleRequest(workingDir, request, callback) {
  var filePath = request.path;
  var componentName = request.component;
  var renderMethod = request.render || "fullscreen";
  var elemId = request.id;
  var data = request.data || {};

  invariant(
    filePath != null,
    'Missing { path } in request'
  )

  invariant(
    componentName != null,
    'Missing { component } in request'
  )

  if (renderMethod === "embed") {
    invariant(
      elemId != null,
      'Missing { id } in request for embedded request'
    )
  }

  var Elm = getDefaultExports(path.resolve(workingDir,filePath));

  invariant(
    !!Elm[componentName],
    'Cannot find the component: %s',
    componentName
  )

  invariant(
    typeof Elm[componentName][renderMethod] === 'function',
    'Cannot find render method: %s',
    renderMethod
  )

  renderers[renderMethod](Elm, request, callback);
}

function createRequestHandler(workingDir) {
  return function (request, callback) {
    delete global.document;
    global.document = new Document();

    try {
      handleRequest(workingDir, request, function (error, html) {
        if (error) {
          callback(error)
        } else if (typeof html !== 'string') {
          // Crash the server process.
          callback(new Error('Render method must return a string'))
        } else {
          callback(null, JSON.stringify({ html: html }))
        }
      })
    } catch (error) {
      callback(null, JSON.stringify({ error: error.message }))
    }
  }
}

// Redirect stdout to stderr, but save a reference so we can
// still write to stdout.
var stdout = process.stdout
Object.defineProperty(process, 'stdout', {
  configurable: true,
  enumerable: true,
  value: process.stderr
})

// Ensure console.log knows about the new stdout.
var Console = require('console').Console
console = new Console(process.stdout, process.stderr)

// Read JSON blobs from stdin, pipe output to stdout.
process.stdin
  .pipe(JSONStream.parse())
  .pipe(EventStream.map(createRequestHandler(process.cwd())))
  .pipe(stdout)
