# elm-stdio [![npm package][npm-badge]][npm]

[npm-badge]: https://img.shields.io/npm/v/elm-stdio.svg?style=flat-square
[npm]: https://www.npmjs.org/package/elm-stdio

[elm-stdio](https://github.com/hassox/elm-stdio) lets you render [Elm](http://elm-lang.org/) components on the server, regardless of the backend technology you're using.

As its name suggests, other processes communicate with elm-stdio using standard streams.
The protocol is JSON, so any environment that can spawn a child process and write JSON to its stdin can use the server.
Requests are handled serially, so responses are issued in the same order requests are received.

## Installation

Using [npm](https://npmjs.com):

    $ npm install elm-stdio min-document

Note that at this time there is a bug in min-document that handles boolean html attributes incorrectly.
The patch at [hassox/min-document](https://github.com/hassox/min-document) addresses this bug.
The [PR](https://github.com/Raynos/min-document/pull/31) requests this change be pulled upstream.

## Usage

Once you've installed the server, you will have a `elm-stdio` binary available (assuming `node_modules/.bin` is in your `$PATH`). Execute it to start the server.

To render a React component, write a JSON blob to stdin with any of the following properties:

    path            The path to a file that exports Elm with your component loaded
    component       The name of the component to render (note only top level components are supported
    render          The rendering method. `fullscreen` or `embed`
    id              The html id attribute of the contianer DIV to render into (when using `embed`)
    data            The object to pass to Elm render method

If the request is successful, the server will put a JSON blob with `{"html":"..."}` on stdout. If the request fails for some reason, the JSON will have an `error` property instead of `html`.

Example:

    $ echo '{"path": "./server/todo.js", "component":"Todo", "render": "embed", "id": "elm-main", "data":{"getStorage":null}}' | elm-stdio

## Environment

Your component file should be a self contained bundle. The file will be loaded
and run.

Additionally, since react-stdio uses the `stdout` stream for all program output, all writes your code makes to `process.stdout` (including `console.log` statements) are redirected to `process.stderr`.

## Embed vs Fullscreen
When rendering using the `fullscreen` method, the output will include the `body` tag.

When rendering using the `embed` method, the output will include the container
div with the correct id attribute.

## Integrations

- [Elixir/Phoenix](http://blog.overstuffedgorilla.com/render-react-with-phoenix/)

If you'd like to add an integration here, please contact [@hassox](https://twitter.com/hassox).
