import esbuild from "esbuild";
import process from "process";

const banner =
`/*
 / THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
 / if you want to view the source, please visit the github repository of this plugin
*/
`;

const dev = (process.argv[2] === 'dev');

// plugin:
esbuild.build({
  banner: {
    js: banner,
  },
  entryPoints: [
    './src/lib.ts'
  ],
  bundle: true,
  format: 'cjs',
  watch: dev,
  target: 'es2018',
  logLevel: "info",
  sourcemap: dev 
    ? 'inline'
    : false,
  treeShaking: true,
  outfile: 'build/'
    + (dev
      ? 'dev'
      : 'prod')
  + '/lib.js',
}).catch(() => process.exit(1));
