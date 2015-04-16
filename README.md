# TOML-j0.4

[![Build Status](https://travis-ci.org/jakwings/toml-j0.4.svg)](https://travis-ci.org/jakwings/toml-j0.4)
[![NPM version](https://badge.fury.io/js/toml-j0.4.svg)](http://badge.fury.io/js/toml-j0.4)

This is a [TOML] v[0.4.0] compliant *only* parser built with [PEG.js].

[TOML]: https://github.com/toml-lang/toml
[0.4.0]: https://github.com/toml-lang/toml/blob/master/versions/en/toml-v0.4.0.md
[PEG.js]: http://pegjs.org


### Live Demo

<http://jakwings.github.io/toml-j0.4/>


### Usage

You can install it via `npm install toml-j0.4`, or just include the script
`dist/toml-browser.js` in your web pages.

```javascript
var toml = toml || require('toml-j0.4');

try {
    var data = toml.parse(src);
} catch (err) {
    if (err instanceof toml.SyntaxError) {
        // do something
    }
}
```

*   `toml.parse` only accept one argument — data text in TOML
*   The instance of `toml.SyntaxError` has these properties:
    * `line`: the line number
    * `column`: the column number
    * `offset`: the zero-based offset from the start of the text
    * `message`: error message

There is no other API for now. Simple?


### Contribute

If you found bugs, welcome to send me a pull request with (only) updated test
scripts/fixtures!

The scripts `lib/parser.js` and `dist/toml-browser.js` are generated via this
command:

```bash
npm run build
```

Then you can test them via this command:

```bash
npm test
```


### Others

This module is also used by other projects:

*   [meta-matter](https://github.com/jakwings/meta-matter)