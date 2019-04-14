'use strict';

require('mocha');
const assert = require('assert').strict;
const { isMatch } = require('..');

describe('invalid (exclusive) dots', () => {
  describe('double dots', () => {
    describe('no options', () => {
      describe('should not match leading double-dots', () => {
        it('with single star', () => {
          assert(!isMatch('../abc', '*/*'));
          assert(!isMatch('../abc', '*/abc'));
          assert(!isMatch('../abc', '*/abc/*'));
        });

        it('with dot + single star', () => {
          assert(!isMatch('../abc', '.*/*'));
          assert(!isMatch('../abc', '.*/abc'));

          assert(!isMatch('../abc', '*./*'));
          assert(!isMatch('../abc', '*./abc'));
        });

        it('with globstar', () => {
          assert(!isMatch('../abc', '**'));
          assert(!isMatch('../abc', '**/**'));
          assert(!isMatch('../abc', '**/**/**'));

          assert(!isMatch('../abc', '**/abc'));
          assert(!isMatch('../abc', '**/abc/**'));

          assert(!isMatch('../abc', 'abc/**'));
          assert(!isMatch('../abc', 'abc/**/**'));
          assert(!isMatch('../abc', 'abc/**/**/**'));

          assert(!isMatch('../abc', '**/abc'));
          assert(!isMatch('../abc', '**/abc/**'));
          assert(!isMatch('../abc', '**/abc/**/**'));

          assert(!isMatch('../abc', '**/**/abc/**'));
          assert(!isMatch('../abc', '**/**/abc/**/**'));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('../abc', '.**'));
          assert(!isMatch('../abc', '.**/**'));
          assert(!isMatch('../abc', '.**/abc'));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('../abc', '*.*/**'));
          assert(!isMatch('../abc', '*.*/abc'));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('../abc', '**./**'));
          assert(!isMatch('../abc', '**./abc'));
        });
      });

      describe('should not match nested double-dots', () => {
        it('with star', () => {
          assert(!isMatch('/../abc', '*/*'));
          assert(!isMatch('/../abc', '/*/*'));
          assert(!isMatch('/../abc', '*/*/*'));

          assert(!isMatch('abc/../abc', '*/*/*'));
          assert(!isMatch('abc/../abc/abc', '*/*/*/*'));
        });

        it('with dot + star', () => {
          assert(!isMatch('/../abc', '*/.*/*'));
          assert(!isMatch('/../abc', '/.*/*'));

          assert(!isMatch('/../abc', '*/*.*/*'));
          assert(!isMatch('/../abc', '/*.*/*'));

          assert(!isMatch('/../abc', '*/*./*'));
          assert(!isMatch('/../abc', '/*./*'));

          assert(!isMatch('abc/../abc', '*/.*/*'));
          assert(!isMatch('abc/../abc', '*/*.*/*'));
          assert(!isMatch('abc/../abc', '*/*./*'));
        });

        it('with globstar', () => {
          assert(!isMatch('/../abc', '**'));
          assert(!isMatch('/../abc', '**/**'));
          assert(!isMatch('/../abc', '/**/**'));
          assert(!isMatch('/../abc', '**/**/**'));

          assert(!isMatch('abc/../abc', '**/**/**'));
          assert(!isMatch('abc/../abc/abc', '**/**/**/**'));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('/../abc', '**/.**/**'));
          assert(!isMatch('/../abc', '/.**/**'));

          assert(!isMatch('abc/../abc', '**/.**/**'));
          assert(!isMatch('abc/../abc', '/.**/**'));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('/../abc', '**/**./**'));
          assert(!isMatch('/../abc', '/**./**'));

          assert(!isMatch('abc/../abc', '**/**./**'));
          assert(!isMatch('abc/../abc', '/**./**'));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('/../abc', '**/**.**/**'));
          assert(!isMatch('/../abc', '**/*.*/**'));

          assert(!isMatch('/../abc', '/**.**/**'));
          assert(!isMatch('/../abc', '/*.*/**'));

          assert(!isMatch('abc/../abc', '**/**.**/**'));
          assert(!isMatch('abc/../abc', '**/*.*/**'));

          assert(!isMatch('abc/../abc', '/**.**/**'));
          assert(!isMatch('abc/../abc', '/*.*/**'));
        });
      });

      describe('should not match trailing double-dots', () => {
        it('with single star', () => {
          assert(!isMatch('abc/..', '*/*'));
          assert(!isMatch('abc/..', '*/*/'));
          assert(!isMatch('abc/..', '*/*/*'));

          assert(!isMatch('abc/../', '*/*'));
          assert(!isMatch('abc/../', '*/*/'));
          assert(!isMatch('abc/../', '*/*/*'));

          assert(!isMatch('abc/../abc/../', '*/*/*/*'));
          assert(!isMatch('abc/../abc/../', '*/*/*/*/'));
          assert(!isMatch('abc/../abc/abc/../', '*/*/*/*/*'));
        });

        it('with dot + star', () => {
          assert(!isMatch('abc/..', '*/.*'));
          assert(!isMatch('abc/..', '*/.*/'));
          assert(!isMatch('abc/..', '*/.*/*'));

          assert(!isMatch('abc/../', '*/.*'));
          assert(!isMatch('abc/../', '*/.*/'));
          assert(!isMatch('abc/../', '*/.*/*'));

          assert(!isMatch('abc/../abc/../', '*/.*/*/.*'));
          assert(!isMatch('abc/../abc/../', '*/.*/*/.*/'));
          assert(!isMatch('abc/../abc/abc/../', '*/.*/*/.*/*'));
        });

        it('with star + dot', () => {
          assert(!isMatch('abc/..', '*/*.'));
          assert(!isMatch('abc/..', '*/*./'));
          assert(!isMatch('abc/..', '*/*./*'));

          assert(!isMatch('abc/../', '*/*.'));
          assert(!isMatch('abc/../', '*/*./'));
          assert(!isMatch('abc/../', '*/*./*'));

          assert(!isMatch('abc/../abc/../', '*/*./*/*.'));
          assert(!isMatch('abc/../abc/../', '*/*./*/*./'));
          assert(!isMatch('abc/../abc/abc/../', '*/*./*/*./*'));
        });

        it('with globstar', () => {
          assert(!isMatch('abc/..', '**/**'));
          assert(!isMatch('abc/..', '**/**/'));
          assert(!isMatch('abc/..', '**/**/**'));

          assert(!isMatch('abc/../', '**/**'));
          assert(!isMatch('abc/../', '**/**/'));
          assert(!isMatch('abc/../', '**/**/**'));

          assert(!isMatch('abc/../abc/../', '**/**/**/**'));
          assert(!isMatch('abc/../abc/../', '**/**/**/**/'));
          assert(!isMatch('abc/../abc/abc/../', '**/**/**/**/**'));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('abc/..', '**/.**'));
          assert(!isMatch('abc/..', '**/.**/'));
          assert(!isMatch('abc/..', '**/.**/**'));

          assert(!isMatch('abc/../', '**/.**'));
          assert(!isMatch('abc/../', '**/.**/'));
          assert(!isMatch('abc/../', '**/.**/**'));

          assert(!isMatch('abc/../abc/../', '**/.**/**/.**'));
          assert(!isMatch('abc/../abc/../', '**/.**/**/.**/'));
          assert(!isMatch('abc/../abc/abc/../', '**/.**/**/.**/**'));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('abc/..', '**/**.**'));
          assert(!isMatch('abc/..', '**/**.**/'));
          assert(!isMatch('abc/..', '**/**.**/**'));

          assert(!isMatch('abc/../', '**/**.**'));
          assert(!isMatch('abc/../', '**/**.**/'));
          assert(!isMatch('abc/../', '**/**.**/**'));

          assert(!isMatch('abc/../abc/../', '**/**.**/**/**.**'));
          assert(!isMatch('abc/../abc/../', '**/**.**/**/**.**/'));
          assert(!isMatch('abc/../abc/abc/../', '**/**.**/**/.**/**'));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('abc/..', '**/**.'));
          assert(!isMatch('abc/..', '**/**./'));
          assert(!isMatch('abc/..', '**/**./**'));

          assert(!isMatch('abc/../', '**/**.'));
          assert(!isMatch('abc/../', '**/**./'));
          assert(!isMatch('abc/../', '**/**./**'));

          assert(!isMatch('abc/../abc/../', '**/**./**/**.'));
          assert(!isMatch('abc/../abc/../', '**/**./**/**./'));
          assert(!isMatch('abc/../abc/abc/../', '**/**./**/**./**'));
        });
      });
    });

    describe('options = { dot: true }', () => {
      describe('should not match leading double-dots', () => {
        it('with single star', () => {
          assert(!isMatch('../abc', '*/*', { dot: true }));
          assert(!isMatch('../abc', '*/abc', { dot: true }));
          assert(!isMatch('../abc', '*/abc/*', { dot: true }));
        });

        it('with dot + single star', () => {
          assert(!isMatch('../abc', '.*/*', { dot: true }));
          assert(!isMatch('../abc', '.*/abc', { dot: true }));

          assert(!isMatch('../abc', '*./*', { dot: true }));
          assert(!isMatch('../abc', '*./abc', { dot: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('../abc', '**', { dot: true }));
          assert(!isMatch('../abc', '**/**', { dot: true }));
          assert(!isMatch('../abc', '**/**/**', { dot: true }));

          assert(!isMatch('../abc', '**/abc', { dot: true }));
          assert(!isMatch('../abc', '**/abc/**', { dot: true }));

          assert(!isMatch('../abc', 'abc/**', { dot: true }));
          assert(!isMatch('../abc', 'abc/**/**', { dot: true }));
          assert(!isMatch('../abc', 'abc/**/**/**', { dot: true }));

          assert(!isMatch('../abc', '**/abc', { dot: true }));
          assert(!isMatch('../abc', '**/abc/**', { dot: true }));
          assert(!isMatch('../abc', '**/abc/**/**', { dot: true }));

          assert(!isMatch('../abc', '**/**/abc/**', { dot: true }));
          assert(!isMatch('../abc', '**/**/abc/**/**', { dot: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('../abc', '.**', { dot: true }));
          assert(!isMatch('../abc', '.**/**', { dot: true }));
          assert(!isMatch('../abc', '.**/abc', { dot: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('../abc', '*.*/**', { dot: true }));
          assert(!isMatch('../abc', '*.*/abc', { dot: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('../abc', '**./**', { dot: true }));
          assert(!isMatch('../abc', '**./abc', { dot: true }));
        });
      });

      describe('should not match nested double-dots', () => {
        it('with star', () => {
          assert(!isMatch('/../abc', '*/*', { dot: true }));
          assert(!isMatch('/../abc', '/*/*', { dot: true }));
          assert(!isMatch('/../abc', '*/*/*', { dot: true }));

          assert(!isMatch('abc/../abc', '*/*/*', { dot: true }));
          assert(!isMatch('abc/../abc/abc', '*/*/*/*', { dot: true }));
        });

        it('with dot + star', () => {
          assert(!isMatch('/../abc', '*/.*/*', { dot: true }));
          assert(!isMatch('/../abc', '/.*/*', { dot: true }));

          assert(!isMatch('/../abc', '*/*.*/*', { dot: true }));
          assert(!isMatch('/../abc', '/*.*/*', { dot: true }));

          assert(!isMatch('/../abc', '*/*./*', { dot: true }));
          assert(!isMatch('/../abc', '/*./*', { dot: true }));

          assert(!isMatch('abc/../abc', '*/.*/*', { dot: true }));
          assert(!isMatch('abc/../abc', '*/*.*/*', { dot: true }));
          assert(!isMatch('abc/../abc', '*/*./*', { dot: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('/../abc', '**', { dot: true }));
          assert(!isMatch('/../abc', '**/**', { dot: true }));
          assert(!isMatch('/../abc', '/**/**', { dot: true }));
          assert(!isMatch('/../abc', '**/**/**', { dot: true }));

          assert(!isMatch('abc/../abc', '**/**/**', { dot: true }));
          assert(!isMatch('abc/../abc/abc', '**/**/**/**', { dot: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('/../abc', '**/.**/**', { dot: true }));
          assert(!isMatch('/../abc', '/.**/**', { dot: true }));

          assert(!isMatch('abc/../abc', '**/.**/**', { dot: true }));
          assert(!isMatch('abc/../abc', '/.**/**', { dot: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('/../abc', '**/**./**', { dot: true }));
          assert(!isMatch('/../abc', '/**./**', { dot: true }));

          assert(!isMatch('abc/../abc', '**/**./**', { dot: true }));
          assert(!isMatch('abc/../abc', '/**./**', { dot: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('/../abc', '**/**.**/**', { dot: true }));
          assert(!isMatch('/../abc', '**/*.*/**', { dot: true }));

          assert(!isMatch('/../abc', '/**.**/**', { dot: true }));
          assert(!isMatch('/../abc', '/*.*/**', { dot: true }));

          assert(!isMatch('abc/../abc', '**/**.**/**', { dot: true }));
          assert(!isMatch('abc/../abc', '**/*.*/**', { dot: true }));

          assert(!isMatch('abc/../abc', '/**.**/**', { dot: true }));
          assert(!isMatch('abc/../abc', '/*.*/**', { dot: true }));
        });
      });

      describe('should not match trailing double-dots', () => {
        it('with single star', () => {
          assert(!isMatch('abc/..', '*/*', { dot: true }));
          assert(!isMatch('abc/..', '*/*/', { dot: true }));
          assert(!isMatch('abc/..', '*/*/*', { dot: true }));

          assert(!isMatch('abc/../', '*/*', { dot: true }));
          assert(!isMatch('abc/../', '*/*/', { dot: true }));
          assert(!isMatch('abc/../', '*/*/*', { dot: true }));

          assert(!isMatch('abc/../abc/../', '*/*/*/*', { dot: true }));
          assert(!isMatch('abc/../abc/../', '*/*/*/*/', { dot: true }));
          assert(!isMatch('abc/../abc/abc/../', '*/*/*/*/*', { dot: true }));
        });

        it('with dot + star', () => {
          assert(!isMatch('abc/..', '*/.*', { dot: true }));
          assert(!isMatch('abc/..', '*/.*/', { dot: true }));
          assert(!isMatch('abc/..', '*/.*/*', { dot: true }));

          assert(!isMatch('abc/../', '*/.*', { dot: true }));
          assert(!isMatch('abc/../', '*/.*/', { dot: true }));
          assert(!isMatch('abc/../', '*/.*/*', { dot: true }));

          assert(!isMatch('abc/../abc/../', '*/.*/*/.*', { dot: true }));
          assert(!isMatch('abc/../abc/../', '*/.*/*/.*/', { dot: true }));
          assert(!isMatch('abc/../abc/abc/../', '*/.*/*/.*/*', { dot: true }));
        });

        it('with star + dot', () => {
          assert(!isMatch('abc/..', '*/*.', { dot: true }));
          assert(!isMatch('abc/..', '*/*./', { dot: true }));
          assert(!isMatch('abc/..', '*/*./*', { dot: true }));

          assert(!isMatch('abc/../', '*/*.', { dot: true }));
          assert(!isMatch('abc/../', '*/*./', { dot: true }));
          assert(!isMatch('abc/../', '*/*./*', { dot: true }));

          assert(!isMatch('abc/../abc/../', '*/*./*/*.', { dot: true }));
          assert(!isMatch('abc/../abc/../', '*/*./*/*./', { dot: true }));
          assert(!isMatch('abc/../abc/abc/../', '*/*./*/*./*', { dot: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('abc/..', '**/**', { dot: true }));
          assert(!isMatch('abc/..', '**/**/', { dot: true }));
          assert(!isMatch('abc/..', '**/**/**', { dot: true }));

          assert(!isMatch('abc/../', '**/**', { dot: true }));
          assert(!isMatch('abc/../', '**/**/', { dot: true }));
          assert(!isMatch('abc/../', '**/**/**', { dot: true }));

          assert(!isMatch('abc/../abc/../', '**/**/**/**', { dot: true }));
          assert(!isMatch('abc/../abc/../', '**/**/**/**/', { dot: true }));
          assert(!isMatch('abc/../abc/abc/../', '**/**/**/**/**', { dot: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('abc/..', '**/.**', { dot: true }));
          assert(!isMatch('abc/..', '**/.**/', { dot: true }));
          assert(!isMatch('abc/..', '**/.**/**', { dot: true }));

          assert(!isMatch('abc/../', '**/.**', { dot: true }));
          assert(!isMatch('abc/../', '**/.**/', { dot: true }));
          assert(!isMatch('abc/../', '**/.**/**', { dot: true }));

          assert(!isMatch('abc/../abc/../', '**/.**/**/.**', { dot: true }));
          assert(!isMatch('abc/../abc/../', '**/.**/**/.**/', { dot: true }));
          assert(!isMatch('abc/../abc/abc/../', '**/.**/**/.**/**', { dot: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('abc/..', '**/**.**', { dot: true }));
          assert(!isMatch('abc/..', '**/**.**/', { dot: true }));
          assert(!isMatch('abc/..', '**/**.**/**', { dot: true }));

          assert(!isMatch('abc/../', '**/**.**', { dot: true }));
          assert(!isMatch('abc/../', '**/**.**/', { dot: true }));
          assert(!isMatch('abc/../', '**/**.**/**', { dot: true }));

          assert(!isMatch('abc/../abc/../', '**/**.**/**/**.**', { dot: true }));
          assert(!isMatch('abc/../abc/../', '**/**.**/**/**.**/', { dot: true }));
          assert(!isMatch('abc/../abc/abc/../', '**/**.**/**/.**/**', { dot: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('abc/..', '**/**.', { dot: true }));
          assert(!isMatch('abc/..', '**/**./', { dot: true }));
          assert(!isMatch('abc/..', '**/**./**', { dot: true }));

          assert(!isMatch('abc/../', '**/**.', { dot: true }));
          assert(!isMatch('abc/../', '**/**./', { dot: true }));
          assert(!isMatch('abc/../', '**/**./**', { dot: true }));

          assert(!isMatch('abc/../abc/../', '**/**./**/**.', { dot: true }));
          assert(!isMatch('abc/../abc/../', '**/**./**/**./', { dot: true }));
          assert(!isMatch('abc/../abc/abc/../', '**/**./**/**./**', { dot: true }));
        });
      });
    });

    describe('options = { strictSlashes: true }', () => {
      describe('should not match leading double-dots', () => {
        it('with single star', () => {
          assert(!isMatch('../abc', '*/*', { strictSlashes: true }));
          assert(!isMatch('../abc', '*/abc', { strictSlashes: true }));
          assert(!isMatch('../abc', '*/abc/*', { strictSlashes: true }));
        });

        it('with dot + single star', () => {
          assert(!isMatch('../abc', '.*/*', { strictSlashes: true }));
          assert(!isMatch('../abc', '.*/abc', { strictSlashes: true }));

          assert(!isMatch('../abc', '*./*', { strictSlashes: true }));
          assert(!isMatch('../abc', '*./abc', { strictSlashes: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('../abc', '**', { strictSlashes: true }));
          assert(!isMatch('../abc', '**/**', { strictSlashes: true }));
          assert(!isMatch('../abc', '**/**/**', { strictSlashes: true }));

          assert(!isMatch('../abc', '**/abc', { strictSlashes: true }));
          assert(!isMatch('../abc', '**/abc/**', { strictSlashes: true }));

          assert(!isMatch('../abc', 'abc/**', { strictSlashes: true }));
          assert(!isMatch('../abc', 'abc/**/**', { strictSlashes: true }));
          assert(!isMatch('../abc', 'abc/**/**/**', { strictSlashes: true }));

          assert(!isMatch('../abc', '**/abc', { strictSlashes: true }));
          assert(!isMatch('../abc', '**/abc/**', { strictSlashes: true }));
          assert(!isMatch('../abc', '**/abc/**/**', { strictSlashes: true }));

          assert(!isMatch('../abc', '**/**/abc/**', { strictSlashes: true }));
          assert(!isMatch('../abc', '**/**/abc/**/**', { strictSlashes: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('../abc', '.**', { strictSlashes: true }));
          assert(!isMatch('../abc', '.**/**', { strictSlashes: true }));
          assert(!isMatch('../abc', '.**/abc', { strictSlashes: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('../abc', '*.*/**', { strictSlashes: true }));
          assert(!isMatch('../abc', '*.*/abc', { strictSlashes: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('../abc', '**./**', { strictSlashes: true }));
          assert(!isMatch('../abc', '**./abc', { strictSlashes: true }));
        });
      });

      describe('should not match nested double-dots', () => {
        it('with star', () => {
          assert(!isMatch('/../abc', '*/*', { strictSlashes: true }));
          assert(!isMatch('/../abc', '/*/*', { strictSlashes: true }));
          assert(!isMatch('/../abc', '*/*/*', { strictSlashes: true }));

          assert(!isMatch('abc/../abc', '*/*/*', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc', '*/*/*/*', { strictSlashes: true }));
        });

        it('with dot + star', () => {
          assert(!isMatch('/../abc', '*/.*/*', { strictSlashes: true }));
          assert(!isMatch('/../abc', '/.*/*', { strictSlashes: true }));

          assert(!isMatch('/../abc', '*/*.*/*', { strictSlashes: true }));
          assert(!isMatch('/../abc', '/*.*/*', { strictSlashes: true }));

          assert(!isMatch('/../abc', '*/*./*', { strictSlashes: true }));
          assert(!isMatch('/../abc', '/*./*', { strictSlashes: true }));

          assert(!isMatch('abc/../abc', '*/.*/*', { strictSlashes: true }));
          assert(!isMatch('abc/../abc', '*/*.*/*', { strictSlashes: true }));
          assert(!isMatch('abc/../abc', '*/*./*', { strictSlashes: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('/../abc', '**', { strictSlashes: true }));
          assert(!isMatch('/../abc', '**/**', { strictSlashes: true }));
          assert(!isMatch('/../abc', '/**/**', { strictSlashes: true }));
          assert(!isMatch('/../abc', '**/**/**', { strictSlashes: true }));

          assert(!isMatch('abc/../abc', '**/**/**', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc', '**/**/**/**', { strictSlashes: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('/../abc', '**/.**/**', { strictSlashes: true }));
          assert(!isMatch('/../abc', '/.**/**', { strictSlashes: true }));

          assert(!isMatch('abc/../abc', '**/.**/**', { strictSlashes: true }));
          assert(!isMatch('abc/../abc', '/.**/**', { strictSlashes: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('/../abc', '**/**./**', { strictSlashes: true }));
          assert(!isMatch('/../abc', '/**./**', { strictSlashes: true }));

          assert(!isMatch('abc/../abc', '**/**./**', { strictSlashes: true }));
          assert(!isMatch('abc/../abc', '/**./**', { strictSlashes: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('/../abc', '**/**.**/**', { strictSlashes: true }));
          assert(!isMatch('/../abc', '**/*.*/**', { strictSlashes: true }));

          assert(!isMatch('/../abc', '/**.**/**', { strictSlashes: true }));
          assert(!isMatch('/../abc', '/*.*/**', { strictSlashes: true }));

          assert(!isMatch('abc/../abc', '**/**.**/**', { strictSlashes: true }));
          assert(!isMatch('abc/../abc', '**/*.*/**', { strictSlashes: true }));

          assert(!isMatch('abc/../abc', '/**.**/**', { strictSlashes: true }));
          assert(!isMatch('abc/../abc', '/*.*/**', { strictSlashes: true }));
        });
      });

      describe('should not match trailing double-dots', () => {
        it('with single star', () => {
          assert(!isMatch('abc/..', '*/*', { strictSlashes: true }));
          assert(!isMatch('abc/..', '*/*/', { strictSlashes: true }));
          assert(!isMatch('abc/..', '*/*/*', { strictSlashes: true }));

          assert(!isMatch('abc/../', '*/*', { strictSlashes: true }));
          assert(!isMatch('abc/../', '*/*/', { strictSlashes: true }));
          assert(!isMatch('abc/../', '*/*/*', { strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '*/*/*/*', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '*/*/*/*/', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '*/*/*/*/*', { strictSlashes: true }));
        });

        it('with dot + star', () => {
          assert(!isMatch('abc/..', '*/.*', { strictSlashes: true }));
          assert(!isMatch('abc/..', '*/.*/', { strictSlashes: true }));
          assert(!isMatch('abc/..', '*/.*/*', { strictSlashes: true }));

          assert(!isMatch('abc/../', '*/.*', { strictSlashes: true }));
          assert(!isMatch('abc/../', '*/.*/', { strictSlashes: true }));
          assert(!isMatch('abc/../', '*/.*/*', { strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '*/.*/*/.*', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '*/.*/*/.*/', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '*/.*/*/.*/*', { strictSlashes: true }));
        });

        it('with star + dot', () => {
          assert(!isMatch('abc/..', '*/*.', { strictSlashes: true }));
          assert(!isMatch('abc/..', '*/*./', { strictSlashes: true }));
          assert(!isMatch('abc/..', '*/*./*', { strictSlashes: true }));

          assert(!isMatch('abc/../', '*/*.', { strictSlashes: true }));
          assert(!isMatch('abc/../', '*/*./', { strictSlashes: true }));
          assert(!isMatch('abc/../', '*/*./*', { strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '*/*./*/*.', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '*/*./*/*./', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '*/*./*/*./*', { strictSlashes: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('abc/..', '**/**', { strictSlashes: true }));
          assert(!isMatch('abc/..', '**/**/', { strictSlashes: true }));
          assert(!isMatch('abc/..', '**/**/**', { strictSlashes: true }));

          assert(!isMatch('abc/../', '**/**', { strictSlashes: true }));
          assert(!isMatch('abc/../', '**/**/', { strictSlashes: true }));
          assert(!isMatch('abc/../', '**/**/**', { strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '**/**/**/**', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '**/**/**/**/', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '**/**/**/**/**', { strictSlashes: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('abc/..', '**/.**', { strictSlashes: true }));
          assert(!isMatch('abc/..', '**/.**/', { strictSlashes: true }));
          assert(!isMatch('abc/..', '**/.**/**', { strictSlashes: true }));

          assert(!isMatch('abc/../', '**/.**', { strictSlashes: true }));
          assert(!isMatch('abc/../', '**/.**/', { strictSlashes: true }));
          assert(!isMatch('abc/../', '**/.**/**', { strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '**/.**/**/.**', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '**/.**/**/.**/', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '**/.**/**/.**/**', { strictSlashes: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('abc/..', '**/**.**', { strictSlashes: true }));
          assert(!isMatch('abc/..', '**/**.**/', { strictSlashes: true }));
          assert(!isMatch('abc/..', '**/**.**/**', { strictSlashes: true }));

          assert(!isMatch('abc/../', '**/**.**', { strictSlashes: true }));
          assert(!isMatch('abc/../', '**/**.**/', { strictSlashes: true }));
          assert(!isMatch('abc/../', '**/**.**/**', { strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '**/**.**/**/**.**', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '**/**.**/**/**.**/', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '**/**.**/**/.**/**', { strictSlashes: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('abc/..', '**/**.', { strictSlashes: true }));
          assert(!isMatch('abc/..', '**/**./', { strictSlashes: true }));
          assert(!isMatch('abc/..', '**/**./**', { strictSlashes: true }));

          assert(!isMatch('abc/../', '**/**.', { strictSlashes: true }));
          assert(!isMatch('abc/../', '**/**./', { strictSlashes: true }));
          assert(!isMatch('abc/../', '**/**./**', { strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '**/**./**/**.', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '**/**./**/**./', { strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '**/**./**/**./**', { strictSlashes: true }));
        });
      });
    });

    describe('options = { dot: true, strictSlashes: true }', () => {
      describe('should not match leading double-dots', () => {
        it('with single star', () => {
          assert(!isMatch('../abc', '*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '*/abc', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '*/abc/*', { dot: true, strictSlashes: true }));
        });

        it('with dot + single star', () => {
          assert(!isMatch('../abc', '.*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '.*/abc', { dot: true, strictSlashes: true }));

          assert(!isMatch('../abc', '*./*', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '*./abc', { dot: true, strictSlashes: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('../abc', '**', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '**/**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('../abc', '**/abc', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '**/abc/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('../abc', 'abc/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', 'abc/**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', 'abc/**/**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('../abc', '**/abc', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '**/abc/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '**/abc/**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('../abc', '**/**/abc/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '**/**/abc/**/**', { dot: true, strictSlashes: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('../abc', '.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '.**/abc', { dot: true, strictSlashes: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('../abc', '*.*/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '*.*/abc', { dot: true, strictSlashes: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('../abc', '**./**', { dot: true, strictSlashes: true }));
          assert(!isMatch('../abc', '**./abc', { dot: true, strictSlashes: true }));
        });
      });

      describe('should not match nested double-dots', () => {
        it('with star', () => {
          assert(!isMatch('/../abc', '*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('/../abc', '/*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('/../abc', '*/*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc', '*/*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc', '*/*/*/*', { dot: true, strictSlashes: true }));
        });

        it('with dot + star', () => {
          assert(!isMatch('/../abc', '*/.*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('/../abc', '/.*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('/../abc', '*/*.*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('/../abc', '/*.*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('/../abc', '*/*./*', { dot: true, strictSlashes: true }));
          assert(!isMatch('/../abc', '/*./*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc', '*/.*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc', '*/*.*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc', '*/*./*', { dot: true, strictSlashes: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('/../abc', '**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/../abc', '**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/../abc', '/**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/../abc', '**/**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc', '**/**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc', '**/**/**/**', { dot: true, strictSlashes: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('/../abc', '**/.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/../abc', '/.**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc', '**/.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc', '/.**/**', { dot: true, strictSlashes: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('/../abc', '**/**./**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/../abc', '/**./**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc', '**/**./**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc', '/**./**', { dot: true, strictSlashes: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('/../abc', '**/**.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/../abc', '**/*.*/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('/../abc', '/**.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/../abc', '/*.*/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc', '**/**.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc', '**/*.*/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc', '/**.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc', '/*.*/**', { dot: true, strictSlashes: true }));
        });
      });

      describe('should not match trailing double-dots', () => {
        it('with single star', () => {
          assert(!isMatch('abc/..', '*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '*/*/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '*/*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../', '*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '*/*/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '*/*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '*/*/*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '*/*/*/*/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '*/*/*/*/*', { dot: true, strictSlashes: true }));
        });

        it('with dot + star', () => {
          assert(!isMatch('abc/..', '*/.*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '*/.*/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '*/.*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../', '*/.*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '*/.*/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '*/.*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '*/.*/*/.*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '*/.*/*/.*/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '*/.*/*/.*/*', { dot: true, strictSlashes: true }));
        });

        it('with star + dot', () => {
          assert(!isMatch('abc/..', '*/*.', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '*/*./', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '*/*./*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../', '*/*.', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '*/*./', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '*/*./*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '*/*./*/*.', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '*/*./*/*./', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '*/*./*/*./*', { dot: true, strictSlashes: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('abc/..', '**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '**/**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '**/**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../', '**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '**/**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '**/**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '**/**/**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '**/**/**/**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '**/**/**/**/**', { dot: true, strictSlashes: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('abc/..', '**/.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '**/.**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '**/.**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../', '**/.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '**/.**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '**/.**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '**/.**/**/.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '**/.**/**/.**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '**/.**/**/.**/**', { dot: true, strictSlashes: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('abc/..', '**/**.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '**/**.**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '**/**.**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../', '**/**.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '**/**.**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '**/**.**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '**/**.**/**/**.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '**/**.**/**/**.**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '**/**.**/**/.**/**', { dot: true, strictSlashes: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('abc/..', '**/**.', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '**/**./', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/..', '**/**./**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../', '**/**.', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '**/**./', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../', '**/**./**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/../abc/../', '**/**./**/**.', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/../', '**/**./**/**./', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/../abc/abc/../', '**/**./**/**./**', { dot: true, strictSlashes: true }));
        });
      });
    });
  });

  describe('single dots', () => {
    describe('no options', () => {
      describe('should not match leading single-dots', () => {
        it('with single star', () => {
          assert(!isMatch('./abc', '*'));
          assert(!isMatch('./abc', '*/*'));
          assert(!isMatch('./abc', '*/abc'));
          assert(!isMatch('./abc', '*/abc/*'));
        });

        it('with dot + single star', () => {
          assert(!isMatch('./abc', '.*/*'));
          assert(!isMatch('./abc', '.*/abc'));

          assert(!isMatch('./abc', '*./*'));
          assert(!isMatch('./abc', '*./abc'));
        });

        it('with globstar', () => {
          assert(!isMatch('./abc', '**'));
          assert(!isMatch('./abc', '**/**'));
          assert(!isMatch('./abc', '**/**/**'));

          assert(!isMatch('./abc', '**/abc'));
          assert(!isMatch('./abc', '**/abc/**'));

          assert(!isMatch('./abc', 'abc/**'));
          assert(!isMatch('./abc', 'abc/**/**'));
          assert(!isMatch('./abc', 'abc/**/**/**'));

          assert(!isMatch('./abc', '**/abc'));
          assert(!isMatch('./abc', '**/abc/**'));
          assert(!isMatch('./abc', '**/abc/**/**'));

          assert(!isMatch('./abc', '**/**/abc/**'));
          assert(!isMatch('./abc', '**/**/abc/**/**'));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('./abc', '.**'));
          assert(!isMatch('./abc', '.**/**'));
          assert(!isMatch('./abc', '.**/abc'));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('./abc', '*.*/**'));
          assert(!isMatch('./abc', '*.*/abc'));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('./abc', '**./**'));
          assert(!isMatch('./abc', '**./abc'));
        });
      });

      describe('should not match nested single-dots', () => {
        it('with star', () => {
          assert(!isMatch('/./abc', '*/*'));
          assert(!isMatch('/./abc', '/*/*'));
          assert(!isMatch('/./abc', '*/*/*'));

          assert(!isMatch('abc/./abc', '*/*/*'));
          assert(!isMatch('abc/./abc/abc', '*/*/*/*'));
        });

        it('with dot + star', () => {
          assert(!isMatch('/./abc', '*/.*/*'));
          assert(!isMatch('/./abc', '/.*/*'));

          assert(!isMatch('/./abc', '*/*.*/*'));
          assert(!isMatch('/./abc', '/*.*/*'));

          assert(!isMatch('/./abc', '*/*./*'));
          assert(!isMatch('/./abc', '/*./*'));

          assert(!isMatch('abc/./abc', '*/.*/*'));
          assert(!isMatch('abc/./abc', '*/*.*/*'));
          assert(!isMatch('abc/./abc', '*/*./*'));
        });

        it('with globstar', () => {
          assert(!isMatch('/./abc', '**'));
          assert(!isMatch('/./abc', '**/**'));
          assert(!isMatch('/./abc', '/**/**'));
          assert(!isMatch('/./abc', '**/**/**'));

          assert(!isMatch('abc/./abc', '**/**/**'));
          assert(!isMatch('abc/./abc/abc', '**/**/**/**'));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('/./abc', '**/.**/**'));
          assert(!isMatch('/./abc', '/.**/**'));

          assert(!isMatch('abc/./abc', '**/.**/**'));
          assert(!isMatch('abc/./abc', '/.**/**'));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('/./abc', '**/**./**'));
          assert(!isMatch('/./abc', '/**./**'));

          assert(!isMatch('abc/./abc', '**/**./**'));
          assert(!isMatch('abc/./abc', '/**./**'));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('/./abc', '**/**.**/**'));
          assert(!isMatch('/./abc', '**/*.*/**'));

          assert(!isMatch('/./abc', '/**.**/**'));
          assert(!isMatch('/./abc', '/*.*/**'));

          assert(!isMatch('abc/./abc', '**/**.**/**'));
          assert(!isMatch('abc/./abc', '**/*.*/**'));

          assert(!isMatch('abc/./abc', '/**.**/**'));
          assert(!isMatch('abc/./abc', '/*.*/**'));
        });
      });

      describe('should not match trailing single-dots', () => {
        it('with single star', () => {
          assert(!isMatch('abc/.', '*/*'));
          assert(!isMatch('abc/.', '*/*/'));
          assert(!isMatch('abc/.', '*/*/*'));

          assert(!isMatch('abc/./', '*/*'));
          assert(!isMatch('abc/./', '*/*/'));
          assert(!isMatch('abc/./', '*/*/*'));

          assert(!isMatch('abc/./abc/./', '*/*/*/*'));
          assert(!isMatch('abc/./abc/./', '*/*/*/*/'));
          assert(!isMatch('abc/./abc/abc/./', '*/*/*/*/*'));
        });

        it('with dot + star', () => {
          assert(!isMatch('abc/.', '*/.*'));
          assert(!isMatch('abc/.', '*/.*/'));
          assert(!isMatch('abc/.', '*/.*/*'));

          assert(!isMatch('abc/./', '*/.*'));
          assert(!isMatch('abc/./', '*/.*/'));
          assert(!isMatch('abc/./', '*/.*/*'));

          assert(!isMatch('abc/./abc/./', '*/.*/*/.*'));
          assert(!isMatch('abc/./abc/./', '*/.*/*/.*/'));
          assert(!isMatch('abc/./abc/abc/./', '*/.*/*/.*/*'));
        });

        it('with star + dot', () => {
          assert(!isMatch('abc/.', '*/*.'));
          assert(!isMatch('abc/.', '*/*./'));
          assert(!isMatch('abc/.', '*/*./*'));

          assert(!isMatch('abc/./', '*/*.'));
          assert(!isMatch('abc/./', '*/*./'));
          assert(!isMatch('abc/./', '*/*./*'));

          assert(!isMatch('abc/./abc/./', '*/*./*/*.'));
          assert(!isMatch('abc/./abc/./', '*/*./*/*./'));
          assert(!isMatch('abc/./abc/abc/./', '*/*./*/*./*'));
        });

        it('with globstar', () => {
          assert(!isMatch('abc/.', '**/**'));
          assert(!isMatch('abc/.', '**/**/'));
          assert(!isMatch('abc/.', '**/**/**'));

          assert(!isMatch('abc/./', '**/**'));
          assert(!isMatch('abc/./', '**/**/'));
          assert(!isMatch('abc/./', '**/**/**'));

          assert(!isMatch('abc/./abc/./', '**/**/**/**'));
          assert(!isMatch('abc/./abc/./', '**/**/**/**/'));
          assert(!isMatch('abc/./abc/abc/./', '**/**/**/**/**'));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('abc/.', '**/.**'));
          assert(!isMatch('abc/.', '**/.**/'));
          assert(!isMatch('abc/.', '**/.**/**'));

          assert(!isMatch('abc/./', '**/.**'));
          assert(!isMatch('abc/./', '**/.**/'));
          assert(!isMatch('abc/./', '**/.**/**'));

          assert(!isMatch('abc/./abc/./', '**/.**/**/.**'));
          assert(!isMatch('abc/./abc/./', '**/.**/**/.**/'));
          assert(!isMatch('abc/./abc/abc/./', '**/.**/**/.**/**'));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('abc/.', '**/**.**'));
          assert(!isMatch('abc/.', '**/**.**/'));
          assert(!isMatch('abc/.', '**/**.**/**'));

          assert(!isMatch('abc/./', '**/**.**'));
          assert(!isMatch('abc/./', '**/**.**/'));
          assert(!isMatch('abc/./', '**/**.**/**'));

          assert(!isMatch('abc/./abc/./', '**/**.**/**/**.**'));
          assert(!isMatch('abc/./abc/./', '**/**.**/**/**.**/'));
          assert(!isMatch('abc/./abc/abc/./', '**/**.**/**/.**/**'));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('abc/.', '**/**.'));
          assert(!isMatch('abc/.', '**/**./'));
          assert(!isMatch('abc/.', '**/**./**'));

          assert(!isMatch('abc/./', '**/**.'));
          assert(!isMatch('abc/./', '**/**./'));
          assert(!isMatch('abc/./', '**/**./**'));

          assert(!isMatch('abc/./abc/./', '**/**./**/**.'));
          assert(!isMatch('abc/./abc/./', '**/**./**/**./'));
          assert(!isMatch('abc/./abc/abc/./', '**/**./**/**./**'));
        });
      });
    });

    describe('options = { dot: true }', () => {
      describe('should not match leading single-dots', () => {
        it('with single star', () => {
          assert(!isMatch('./abc', '*/*', { dot: true }));
          assert(!isMatch('./abc', '*/abc', { dot: true }));
          assert(!isMatch('./abc', '*/abc/*', { dot: true }));
        });

        it('with dot + single star', () => {
          assert(!isMatch('./abc', '.*/*', { dot: true }));
          assert(!isMatch('./abc', '.*/abc', { dot: true }));

          assert(!isMatch('./abc', '*./*', { dot: true }));
          assert(!isMatch('./abc', '*./abc', { dot: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('./abc', '**', { dot: true }));
          assert(!isMatch('./abc', '**/**', { dot: true }));
          assert(!isMatch('./abc', '**/**/**', { dot: true }));

          assert(!isMatch('./abc', '**/abc', { dot: true }));
          assert(!isMatch('./abc', '**/abc/**', { dot: true }));

          assert(!isMatch('./abc', 'abc/**', { dot: true }));
          assert(!isMatch('./abc', 'abc/**/**', { dot: true }));
          assert(!isMatch('./abc', 'abc/**/**/**', { dot: true }));

          assert(!isMatch('./abc', '**/abc', { dot: true }));
          assert(!isMatch('./abc', '**/abc/**', { dot: true }));
          assert(!isMatch('./abc', '**/abc/**/**', { dot: true }));

          assert(!isMatch('./abc', '**/**/abc/**', { dot: true }));
          assert(!isMatch('./abc', '**/**/abc/**/**', { dot: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('./abc', '.**', { dot: true }));
          assert(!isMatch('./abc', '.**/**', { dot: true }));
          assert(!isMatch('./abc', '.**/abc', { dot: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('./abc', '*.*/**', { dot: true }));
          assert(!isMatch('./abc', '*.*/abc', { dot: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('./abc', '**./**', { dot: true }));
          assert(!isMatch('./abc', '**./abc', { dot: true }));
        });
      });

      describe('should not match nested single-dots', () => {
        it('with star', () => {
          assert(!isMatch('/./abc', '*/*', { dot: true }));
          assert(!isMatch('/./abc', '/*/*', { dot: true }));
          assert(!isMatch('/./abc', '*/*/*', { dot: true }));

          assert(!isMatch('abc/./abc', '*/*/*', { dot: true }));
          assert(!isMatch('abc/./abc/abc', '*/*/*/*', { dot: true }));
        });

        it('with dot + star', () => {
          assert(!isMatch('/./abc', '*/.*/*', { dot: true }));
          assert(!isMatch('/./abc', '/.*/*', { dot: true }));

          assert(!isMatch('/./abc', '*/*.*/*', { dot: true }));
          assert(!isMatch('/./abc', '/*.*/*', { dot: true }));

          assert(!isMatch('/./abc', '*/*./*', { dot: true }));
          assert(!isMatch('/./abc', '/*./*', { dot: true }));

          assert(!isMatch('abc/./abc', '*/.*/*', { dot: true }));
          assert(!isMatch('abc/./abc', '*/*.*/*', { dot: true }));
          assert(!isMatch('abc/./abc', '*/*./*', { dot: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('/./abc', '**', { dot: true }));
          assert(!isMatch('/./abc', '**/**', { dot: true }));
          assert(!isMatch('/./abc', '/**/**', { dot: true }));
          assert(!isMatch('/./abc', '**/**/**', { dot: true }));

          assert(!isMatch('abc/./abc', '**/**/**', { dot: true }));
          assert(!isMatch('abc/./abc/abc', '**/**/**/**', { dot: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('/./abc', '**/.**/**', { dot: true }));
          assert(!isMatch('/./abc', '/.**/**', { dot: true }));

          assert(!isMatch('abc/./abc', '**/.**/**', { dot: true }));
          assert(!isMatch('abc/./abc', '/.**/**', { dot: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('/./abc', '**/**./**', { dot: true }));
          assert(!isMatch('/./abc', '/**./**', { dot: true }));

          assert(!isMatch('abc/./abc', '**/**./**', { dot: true }));
          assert(!isMatch('abc/./abc', '/**./**', { dot: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('/./abc', '**/**.**/**', { dot: true }));
          assert(!isMatch('/./abc', '**/*.*/**', { dot: true }));

          assert(!isMatch('/./abc', '/**.**/**', { dot: true }));
          assert(!isMatch('/./abc', '/*.*/**', { dot: true }));

          assert(!isMatch('abc/./abc', '**/**.**/**', { dot: true }));
          assert(!isMatch('abc/./abc', '**/*.*/**', { dot: true }));

          assert(!isMatch('abc/./abc', '/**.**/**', { dot: true }));
          assert(!isMatch('abc/./abc', '/*.*/**', { dot: true }));
        });
      });

      describe('should not match trailing single-dots', () => {
        it('with single star', () => {
          assert(!isMatch('abc/.', '*/*', { dot: true }));
          assert(!isMatch('abc/.', '*/*/', { dot: true }));
          assert(!isMatch('abc/.', '*/*/*', { dot: true }));

          assert(!isMatch('abc/./', '*/*', { dot: true }));
          assert(!isMatch('abc/./', '*/*/', { dot: true }));
          assert(!isMatch('abc/./', '*/*/*', { dot: true }));

          assert(!isMatch('abc/./abc/./', '*/*/*/*', { dot: true }));
          assert(!isMatch('abc/./abc/./', '*/*/*/*/', { dot: true }));
          assert(!isMatch('abc/./abc/abc/./', '*/*/*/*/*', { dot: true }));
        });

        it('with dot + star', () => {
          assert(!isMatch('abc/.', '*/.*', { dot: true }));
          assert(!isMatch('abc/.', '*/.*/', { dot: true }));
          assert(!isMatch('abc/.', '*/.*/*', { dot: true }));

          assert(!isMatch('abc/./', '*/.*', { dot: true }));
          assert(!isMatch('abc/./', '*/.*/', { dot: true }));
          assert(!isMatch('abc/./', '*/.*/*', { dot: true }));

          assert(!isMatch('abc/./abc/./', '*/.*/*/.*', { dot: true }));
          assert(!isMatch('abc/./abc/./', '*/.*/*/.*/', { dot: true }));
          assert(!isMatch('abc/./abc/abc/./', '*/.*/*/.*/*', { dot: true }));
        });

        it('with star + dot', () => {
          assert(!isMatch('abc/.', '*/*.', { dot: true }));
          assert(!isMatch('abc/.', '*/*./', { dot: true }));
          assert(!isMatch('abc/.', '*/*./*', { dot: true }));

          assert(!isMatch('abc/./', '*/*.', { dot: true }));
          assert(!isMatch('abc/./', '*/*./', { dot: true }));
          assert(!isMatch('abc/./', '*/*./*', { dot: true }));

          assert(!isMatch('abc/./abc/./', '*/*./*/*.', { dot: true }));
          assert(!isMatch('abc/./abc/./', '*/*./*/*./', { dot: true }));
          assert(!isMatch('abc/./abc/abc/./', '*/*./*/*./*', { dot: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('abc/.', '**/**', { dot: true }));
          assert(!isMatch('abc/.', '**/**/', { dot: true }));
          assert(!isMatch('abc/.', '**/**/**', { dot: true }));

          assert(!isMatch('abc/./', '**/**', { dot: true }));
          assert(!isMatch('abc/./', '**/**/', { dot: true }));
          assert(!isMatch('abc/./', '**/**/**', { dot: true }));

          assert(!isMatch('abc/./abc/./', '**/**/**/**', { dot: true }));
          assert(!isMatch('abc/./abc/./', '**/**/**/**/', { dot: true }));
          assert(!isMatch('abc/./abc/abc/./', '**/**/**/**/**', { dot: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('abc/.', '**/.**', { dot: true }));
          assert(!isMatch('abc/.', '**/.**/', { dot: true }));
          assert(!isMatch('abc/.', '**/.**/**', { dot: true }));

          assert(!isMatch('abc/./', '**/.**', { dot: true }));
          assert(!isMatch('abc/./', '**/.**/', { dot: true }));
          assert(!isMatch('abc/./', '**/.**/**', { dot: true }));

          assert(!isMatch('abc/./abc/./', '**/.**/**/.**', { dot: true }));
          assert(!isMatch('abc/./abc/./', '**/.**/**/.**/', { dot: true }));
          assert(!isMatch('abc/./abc/abc/./', '**/.**/**/.**/**', { dot: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('abc/.', '**/**.**', { dot: true }));
          assert(!isMatch('abc/.', '**/**.**/', { dot: true }));
          assert(!isMatch('abc/.', '**/**.**/**', { dot: true }));

          assert(!isMatch('abc/./', '**/**.**', { dot: true }));
          assert(!isMatch('abc/./', '**/**.**/', { dot: true }));
          assert(!isMatch('abc/./', '**/**.**/**', { dot: true }));

          assert(!isMatch('abc/./abc/./', '**/**.**/**/**.**', { dot: true }));
          assert(!isMatch('abc/./abc/./', '**/**.**/**/**.**/', { dot: true }));
          assert(!isMatch('abc/./abc/abc/./', '**/**.**/**/.**/**', { dot: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('abc/.', '**/**.', { dot: true }));
          assert(!isMatch('abc/.', '**/**./', { dot: true }));
          assert(!isMatch('abc/.', '**/**./**', { dot: true }));

          assert(!isMatch('abc/./', '**/**.', { dot: true }));
          assert(!isMatch('abc/./', '**/**./', { dot: true }));
          assert(!isMatch('abc/./', '**/**./**', { dot: true }));

          assert(!isMatch('abc/./abc/./', '**/**./**/**.', { dot: true }));
          assert(!isMatch('abc/./abc/./', '**/**./**/**./', { dot: true }));
          assert(!isMatch('abc/./abc/abc/./', '**/**./**/**./**', { dot: true }));
        });
      });
    });

    describe('options = { strictSlashes: true }', () => {
      describe('should not match leading single-dots', () => {
        it('with single star', () => {
          assert(!isMatch('./abc', '*/*', { strictSlashes: true }));
          assert(!isMatch('./abc', '*/abc', { strictSlashes: true }));
          assert(!isMatch('./abc', '*/abc/*', { strictSlashes: true }));
        });

        it('with dot + single star', () => {
          assert(!isMatch('./abc', '.*/*', { strictSlashes: true }));
          assert(!isMatch('./abc', '.*/abc', { strictSlashes: true }));

          assert(!isMatch('./abc', '*./*', { strictSlashes: true }));
          assert(!isMatch('./abc', '*./abc', { strictSlashes: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('./abc', '**', { strictSlashes: true }));
          assert(!isMatch('./abc', '**/**', { strictSlashes: true }));
          assert(!isMatch('./abc', '**/**/**', { strictSlashes: true }));

          assert(!isMatch('./abc', '**/abc', { strictSlashes: true }));
          assert(!isMatch('./abc', '**/abc/**', { strictSlashes: true }));

          assert(!isMatch('./abc', 'abc/**', { strictSlashes: true }));
          assert(!isMatch('./abc', 'abc/**/**', { strictSlashes: true }));
          assert(!isMatch('./abc', 'abc/**/**/**', { strictSlashes: true }));

          assert(!isMatch('./abc', '**/abc', { strictSlashes: true }));
          assert(!isMatch('./abc', '**/abc/**', { strictSlashes: true }));
          assert(!isMatch('./abc', '**/abc/**/**', { strictSlashes: true }));

          assert(!isMatch('./abc', '**/**/abc/**', { strictSlashes: true }));
          assert(!isMatch('./abc', '**/**/abc/**/**', { strictSlashes: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('./abc', '.**', { strictSlashes: true }));
          assert(!isMatch('./abc', '.**/**', { strictSlashes: true }));
          assert(!isMatch('./abc', '.**/abc', { strictSlashes: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('./abc', '*.*/**', { strictSlashes: true }));
          assert(!isMatch('./abc', '*.*/abc', { strictSlashes: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('./abc', '**./**', { strictSlashes: true }));
          assert(!isMatch('./abc', '**./abc', { strictSlashes: true }));
        });
      });

      describe('should not match nested single-dots', () => {
        it('with star', () => {
          assert(!isMatch('/./abc', '*/*', { strictSlashes: true }));
          assert(!isMatch('/./abc', '/*/*', { strictSlashes: true }));
          assert(!isMatch('/./abc', '*/*/*', { strictSlashes: true }));

          assert(!isMatch('abc/./abc', '*/*/*', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc', '*/*/*/*', { strictSlashes: true }));
        });

        it('with dot + star', () => {
          assert(!isMatch('/./abc', '*/.*/*', { strictSlashes: true }));
          assert(!isMatch('/./abc', '/.*/*', { strictSlashes: true }));

          assert(!isMatch('/./abc', '*/*.*/*', { strictSlashes: true }));
          assert(!isMatch('/./abc', '/*.*/*', { strictSlashes: true }));

          assert(!isMatch('/./abc', '*/*./*', { strictSlashes: true }));
          assert(!isMatch('/./abc', '/*./*', { strictSlashes: true }));

          assert(!isMatch('abc/./abc', '*/.*/*', { strictSlashes: true }));
          assert(!isMatch('abc/./abc', '*/*.*/*', { strictSlashes: true }));
          assert(!isMatch('abc/./abc', '*/*./*', { strictSlashes: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('/./abc', '**', { strictSlashes: true }));
          assert(!isMatch('/./abc', '**/**', { strictSlashes: true }));
          assert(!isMatch('/./abc', '/**/**', { strictSlashes: true }));
          assert(!isMatch('/./abc', '**/**/**', { strictSlashes: true }));

          assert(!isMatch('abc/./abc', '**/**/**', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc', '**/**/**/**', { strictSlashes: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('/./abc', '**/.**/**', { strictSlashes: true }));
          assert(!isMatch('/./abc', '/.**/**', { strictSlashes: true }));

          assert(!isMatch('abc/./abc', '**/.**/**', { strictSlashes: true }));
          assert(!isMatch('abc/./abc', '/.**/**', { strictSlashes: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('/./abc', '**/**./**', { strictSlashes: true }));
          assert(!isMatch('/./abc', '/**./**', { strictSlashes: true }));

          assert(!isMatch('abc/./abc', '**/**./**', { strictSlashes: true }));
          assert(!isMatch('abc/./abc', '/**./**', { strictSlashes: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('/./abc', '**/**.**/**', { strictSlashes: true }));
          assert(!isMatch('/./abc', '**/*.*/**', { strictSlashes: true }));

          assert(!isMatch('/./abc', '/**.**/**', { strictSlashes: true }));
          assert(!isMatch('/./abc', '/*.*/**', { strictSlashes: true }));

          assert(!isMatch('abc/./abc', '**/**.**/**', { strictSlashes: true }));
          assert(!isMatch('abc/./abc', '**/*.*/**', { strictSlashes: true }));

          assert(!isMatch('abc/./abc', '/**.**/**', { strictSlashes: true }));
          assert(!isMatch('abc/./abc', '/*.*/**', { strictSlashes: true }));
        });
      });

      describe('should not match trailing single-dots', () => {
        it('with single star', () => {
          assert(!isMatch('abc/.', '*/*', { strictSlashes: true }));
          assert(!isMatch('abc/.', '*/*/', { strictSlashes: true }));
          assert(!isMatch('abc/.', '*/*/*', { strictSlashes: true }));

          assert(!isMatch('abc/./', '*/*', { strictSlashes: true }));
          assert(!isMatch('abc/./', '*/*/', { strictSlashes: true }));
          assert(!isMatch('abc/./', '*/*/*', { strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '*/*/*/*', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '*/*/*/*/', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '*/*/*/*/*', { strictSlashes: true }));
        });

        it('with dot + star', () => {
          assert(!isMatch('abc/.', '*/.*', { strictSlashes: true }));
          assert(!isMatch('abc/.', '*/.*/', { strictSlashes: true }));
          assert(!isMatch('abc/.', '*/.*/*', { strictSlashes: true }));

          assert(!isMatch('abc/./', '*/.*', { strictSlashes: true }));
          assert(!isMatch('abc/./', '*/.*/', { strictSlashes: true }));
          assert(!isMatch('abc/./', '*/.*/*', { strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '*/.*/*/.*', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '*/.*/*/.*/', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '*/.*/*/.*/*', { strictSlashes: true }));
        });

        it('with star + dot', () => {
          assert(!isMatch('abc/.', '*/*.', { strictSlashes: true }));
          assert(!isMatch('abc/.', '*/*./', { strictSlashes: true }));
          assert(!isMatch('abc/.', '*/*./*', { strictSlashes: true }));

          assert(!isMatch('abc/./', '*/*.', { strictSlashes: true }));
          assert(!isMatch('abc/./', '*/*./', { strictSlashes: true }));
          assert(!isMatch('abc/./', '*/*./*', { strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '*/*./*/*.', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '*/*./*/*./', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '*/*./*/*./*', { strictSlashes: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('abc/.', '**/**', { strictSlashes: true }));
          assert(!isMatch('abc/.', '**/**/', { strictSlashes: true }));
          assert(!isMatch('abc/.', '**/**/**', { strictSlashes: true }));

          assert(!isMatch('abc/./', '**/**', { strictSlashes: true }));
          assert(!isMatch('abc/./', '**/**/', { strictSlashes: true }));
          assert(!isMatch('abc/./', '**/**/**', { strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '**/**/**/**', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '**/**/**/**/', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '**/**/**/**/**', { strictSlashes: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('abc/.', '**/.**', { strictSlashes: true }));
          assert(!isMatch('abc/.', '**/.**/', { strictSlashes: true }));
          assert(!isMatch('abc/.', '**/.**/**', { strictSlashes: true }));

          assert(!isMatch('abc/./', '**/.**', { strictSlashes: true }));
          assert(!isMatch('abc/./', '**/.**/', { strictSlashes: true }));
          assert(!isMatch('abc/./', '**/.**/**', { strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '**/.**/**/.**', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '**/.**/**/.**/', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '**/.**/**/.**/**', { strictSlashes: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('abc/.', '**/**.**', { strictSlashes: true }));
          assert(!isMatch('abc/.', '**/**.**/', { strictSlashes: true }));
          assert(!isMatch('abc/.', '**/**.**/**', { strictSlashes: true }));

          assert(!isMatch('abc/./', '**/**.**', { strictSlashes: true }));
          assert(!isMatch('abc/./', '**/**.**/', { strictSlashes: true }));
          assert(!isMatch('abc/./', '**/**.**/**', { strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '**/**.**/**/**.**', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '**/**.**/**/**.**/', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '**/**.**/**/.**/**', { strictSlashes: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('abc/.', '**/**.', { strictSlashes: true }));
          assert(!isMatch('abc/.', '**/**./', { strictSlashes: true }));
          assert(!isMatch('abc/.', '**/**./**', { strictSlashes: true }));

          assert(!isMatch('abc/./', '**/**.', { strictSlashes: true }));
          assert(!isMatch('abc/./', '**/**./', { strictSlashes: true }));
          assert(!isMatch('abc/./', '**/**./**', { strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '**/**./**/**.', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '**/**./**/**./', { strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '**/**./**/**./**', { strictSlashes: true }));
        });
      });
    });

    describe('options = { dot: true, strictSlashes: true }', () => {
      describe('should not match leading single-dots', () => {
        it('with single star', () => {
          assert(!isMatch('./abc', '*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '*/abc', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '*/abc/*', { dot: true, strictSlashes: true }));
        });

        it('with dot + single star', () => {
          assert(!isMatch('./abc', '.*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '.*/abc', { dot: true, strictSlashes: true }));

          assert(!isMatch('./abc', '*./*', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '*./abc', { dot: true, strictSlashes: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('./abc', '**', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '**/**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('./abc', '**/abc', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '**/abc/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('./abc', 'abc/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', 'abc/**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', 'abc/**/**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('./abc', '**/abc', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '**/abc/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '**/abc/**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('./abc', '**/**/abc/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '**/**/abc/**/**', { dot: true, strictSlashes: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('./abc', '.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '.**/abc', { dot: true, strictSlashes: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('./abc', '*.*/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '*.*/abc', { dot: true, strictSlashes: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('./abc', '**./**', { dot: true, strictSlashes: true }));
          assert(!isMatch('./abc', '**./abc', { dot: true, strictSlashes: true }));
        });
      });

      describe('should not match nested single-dots', () => {
        it('with star', () => {
          assert(!isMatch('/./abc', '*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('/./abc', '/*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('/./abc', '*/*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc', '*/*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc', '*/*/*/*', { dot: true, strictSlashes: true }));
        });

        it('with dot + star', () => {
          assert(!isMatch('/./abc', '*/.*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('/./abc', '/.*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('/./abc', '*/*.*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('/./abc', '/*.*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('/./abc', '*/*./*', { dot: true, strictSlashes: true }));
          assert(!isMatch('/./abc', '/*./*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc', '*/.*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc', '*/*.*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc', '*/*./*', { dot: true, strictSlashes: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('/./abc', '**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/./abc', '**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/./abc', '/**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/./abc', '**/**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc', '**/**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc', '**/**/**/**', { dot: true, strictSlashes: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('/./abc', '**/.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/./abc', '/.**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc', '**/.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc', '/.**/**', { dot: true, strictSlashes: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('/./abc', '**/**./**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/./abc', '/**./**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc', '**/**./**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc', '/**./**', { dot: true, strictSlashes: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('/./abc', '**/**.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/./abc', '**/*.*/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('/./abc', '/**.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('/./abc', '/*.*/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc', '**/**.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc', '**/*.*/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc', '/**.**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc', '/*.*/**', { dot: true, strictSlashes: true }));
        });
      });

      describe('should not match trailing single-dots', () => {
        it('with single star', () => {
          assert(!isMatch('abc/.', '*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '*/*/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '*/*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./', '*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '*/*/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '*/*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '*/*/*/*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '*/*/*/*/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '*/*/*/*/*', { dot: true, strictSlashes: true }));
        });

        it('with dot + star', () => {
          assert(!isMatch('abc/.', '*/.*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '*/.*/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '*/.*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./', '*/.*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '*/.*/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '*/.*/*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '*/.*/*/.*', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '*/.*/*/.*/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '*/.*/*/.*/*', { dot: true, strictSlashes: true }));
        });

        it('with star + dot', () => {
          assert(!isMatch('abc/.', '*/*.', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '*/*./', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '*/*./*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./', '*/*.', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '*/*./', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '*/*./*', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '*/*./*/*.', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '*/*./*/*./', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '*/*./*/*./*', { dot: true, strictSlashes: true }));
        });

        it('with globstar', () => {
          assert(!isMatch('abc/.', '**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '**/**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '**/**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./', '**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '**/**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '**/**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '**/**/**/**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '**/**/**/**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '**/**/**/**/**', { dot: true, strictSlashes: true }));
        });

        it('with dot + globstar', () => {
          assert(!isMatch('abc/.', '**/.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '**/.**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '**/.**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./', '**/.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '**/.**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '**/.**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '**/.**/**/.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '**/.**/**/.**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '**/.**/**/.**/**', { dot: true, strictSlashes: true }));
        });

        it('with globstar + dot + globstar', () => {
          assert(!isMatch('abc/.', '**/**.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '**/**.**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '**/**.**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./', '**/**.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '**/**.**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '**/**.**/**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '**/**.**/**/**.**', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '**/**.**/**/**.**/', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '**/**.**/**/.**/**', { dot: true, strictSlashes: true }));
        });

        it('with globstar + dot', () => {
          assert(!isMatch('abc/.', '**/**.', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '**/**./', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/.', '**/**./**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./', '**/**.', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '**/**./', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./', '**/**./**', { dot: true, strictSlashes: true }));

          assert(!isMatch('abc/./abc/./', '**/**./**/**.', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/./', '**/**./**/**./', { dot: true, strictSlashes: true }));
          assert(!isMatch('abc/./abc/abc/./', '**/**./**/**./**', { dot: true, strictSlashes: true }));
        });
      });
    });
  });
});
