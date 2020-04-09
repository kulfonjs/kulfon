// Copyright Zaiste. All rights reserved.
// Licensed under the Apache License, Version 2.0

const http = require('http');
const url = require('url');
const { join, extname } = require('path');
const fs = require('fs');

const MIMETypes = {
  ".html": "text/html",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".js": "text/javascript",
  ".css": "text/css"
};

const isFileTricky = pathname => !!extname(pathname);

// FIXME make parametrized
const server = http.createServer(async (request, response) => {
  const { pathname } = url.parse(request.url);

  const file = isFileTricky(pathname) ? pathname : join(pathname, 'index.html');
  const data = fs.createReadStream(join('public', file));
  const ext = extname(file);

  response.writeHead(200, { 'Content-Type': MIMETypes[ext] });
  data.pipe(response);

  data.on('error', error => {
    if (error.code === 'ENOENT') {
      response.statusCode = 404;
      response.end(`'${pathname}' not found!`);
    } else {
      response.statusCode = 500;
      response.end(`Error for ${pathname} -> ${error.message}.`);
    }
  })
});

module.exports = { server };
