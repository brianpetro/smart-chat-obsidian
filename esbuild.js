/**
 * @file esbuild.js
 * @description Minimal build script for bundling your Obsidian plugin with esbuild (ESM).
 * Run "npm run build" or "node esbuild.js".
 *
 * This script:
 *   1) Bundles main.js into "sample-plugin.js" using esbuild.
 *   2) Reads .env (if present) for OBSIDIAN_PLUGIN_FOLDER.
 *   3) Copies the plugin files into the Obsidian plugin directory (if configured).
 */

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { build_smart_env_config } from 'obsidian-smart-env/build_smart_env_config.js';

console.log('process.cwd()', process.cwd());
const roots = [
  path.resolve(process.cwd(), 'src'),
  // path.resolve(process.cwd(), '..', 'smart-context-obsidian', 'src'),
];
console.log('roots', roots);
build_smart_env_config(process.cwd(), roots);

/**
 * Plugin to process CSS files imported with an import attribute:
 *   import sheet from './style.css' with { type: 'css' };
 *
 * When such an import is detected, the plugin loads the CSS file,
 * optionally minifies it if the build options request minification,
 * and wraps the CSS text into a new CSSStyleSheet. The module then
 * exports the stylesheet as its default export.
 *
 * @returns {esbuild.Plugin} The esbuild plugin object.
 */
export function css_with_plugin() {
  return {
    name: 'css-with-plugin',
    setup(build) {
      // Intercept all .css files
      build.onLoad({ filter: /\.css$/ }, async (args) => {
        // Check for the "with" import attribute and that its type is 'css'
        if (args.with && args.with.type === 'css') {
          // Read the CSS file contents
          const fs = await import('fs/promises');
          let css_content = await fs.readFile(args.path, 'utf8');

          // Optionally transform (minify) the CSS if minification is enabled
          const should_minify = build.initialOptions.minify || false;
          if (should_minify) {
            const result = await esbuild.transform(css_content, {
              loader: 'css',
              minify: true,
            });
            css_content = result.code;
          }

          // Escape any backticks in the CSS content to avoid breaking the template literal
          const escaped_css = css_content.replace(/`/g, '\\`');

          // Create a JavaScript module that creates a CSSStyleSheet and exports it
          const js_module = `
            const css_sheet = new CSSStyleSheet();
            css_sheet.replaceSync(\`${escaped_css}\`);
            export default css_sheet;
          `;

          return {
            contents: js_module,
            loader: 'js',
          };
        }
        // If the "with" attribute is not present or not type "css",
        // return undefined so that other loaders/plugins can process it.
      });
    },
  };
}

// if directory doesn't exist, create it
if(!fs.existsSync(path.join(process.cwd(), 'dist'))) {
  fs.mkdirSync(path.join(process.cwd(), 'dist'), { recursive: true });
}

const main_path = path.join(process.cwd(), 'dist', 'main.js');
const manifest_path = path.join(process.cwd(), 'manifest.json');
const styles_path = path.join(process.cwd(), 'styles.css');
// Update manifest.json version
const package_json = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')));
const manifest_json = JSON.parse(fs.readFileSync(manifest_path));
manifest_json.version = package_json.version;
fs.writeFileSync(manifest_path, JSON.stringify(manifest_json, null, 2));
// copy manifest and styles to dist
fs.copyFileSync(manifest_path, path.join(process.cwd(), 'dist', 'manifest.json'));
fs.copyFileSync(styles_path, path.join(process.cwd(), 'dist', 'styles.css'));

const destination_vaults = process.env.DESTINATION_VAULTS.split(',');

// get first argument as entry point
const entry_point = process.argv[2] || 'main.js';

// Build the project
esbuild.build({
  entryPoints: [entry_point],
  outfile: 'dist/main.js',
  format: 'cjs',
  bundle: true,
  write: true,
  sourcemap: 'inline',
  target: "es2022",
  logLevel: "info",
  treeShaking: true,
  platform: 'node',
  preserveSymlinks: true,
  external: [
    'electron',
    'obsidian',
    'crypto',
    '@codemirror/view',
    '@codemirror/state',
    '@huggingface/transformers',
  ],
  define: {
  },
  plugins: [css_with_plugin()],
}).then(() => {
  console.log('Build complete');
  const release_file_paths = [manifest_path, styles_path, main_path];
  for(let vault of destination_vaults) {
    const destDir = path.join(process.cwd(), '..', vault, '.obsidian', 'plugins', 'smart-chat');
    console.log(`Copying files to ${destDir}`);
    fs.mkdirSync(destDir, { recursive: true });
    // create .hotreload file if it doesn't exist
    if(!fs.existsSync(path.join(destDir, '.hotreload'))) {
      fs.writeFileSync(path.join(destDir, '.hotreload'), '');
    }
    release_file_paths.forEach(file_path => {
      fs.copyFileSync(file_path, path.join(destDir, path.basename(file_path)));
    });
    console.log(`Copied files to ${destDir}`);
  }
}).catch(() => process.exit(1));
