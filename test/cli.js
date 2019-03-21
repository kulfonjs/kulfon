import test from 'ava';
import nixt from 'nixt';

import { unfold } from '../cli/util';

test.cb('it outputs `usage` if run without a command', t => {
  nixt()
    .run('kulfon')
    .stderr(/Usage: kulfon <command> \[options\]/i)
    .stderr(/You need at least one command before moving on/i)
    .end(t.end);
});

// test.cb('it throws Error if wrong directory structure', t => {
//   nixt()
//     .run('kulfon compile')
//     .stderr(/Error: It seems you are not in 'kulfon' compatible directory. Here's the proper structure:/i)
//     .stderr(/javascripts/i)
//     .end(t.end);
// });

test('bar', async t => {
  const bar = Promise.resolve('bar');

  t.is(await bar, 'bar');
});

let request = {
  __http: {
    __request: {
      url: 'https://httpbin.org/anything'
    },
    __response: {
      headers: {}
    }
  }
};

let response = {
  headers: {
    Accept: 'application/json, text/plain, */*',
    Host: 'httpbin.org',
    'User-Agent': 'axios/0.18.0'
  }
};

const input = _ => ({
  title: 'Hello, world',
  names: ['A', 'B', 'C'],
  conference: {
    room: _
  },
  workshops: [
    {
      speakers: ['aaa', 'bbb'],
      widgets: {
        __http: {}
      }
    }
  ]
});

test('unfolding of data sources', async t => {
  const result = await unfold(input(request));

  t.deepEqual(input(response), result);
});
