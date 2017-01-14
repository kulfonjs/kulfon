import test from 'ava';
// import nixt from 'nixt';
var nixt = require('nixt');

test.cb('it outputs `usage` if run without a command', t => {
    nixt()
      .run('kulfon')
      .stderr(/Usage: kulfon <command> \[options\]/i)
      .stderr(/You need at least one command before moving on/i)
      .end(t.end);
});

test('bar', async t => {
    const bar = Promise.resolve('bar');

    t.is(await bar, 'bar');
});
