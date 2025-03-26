import {create} from './shell.mjs';
const sh = await create();
const pkg = sh.rel("./package.json").obj();
console.log(pkg.workspaces);
const ver=pkg.version;
for (let workspace of pkg.workspaces) {
  console.log(workspace); 
  sh.pushd(workspace);
  await sh.exec("npm", ["version", ver]);
  sh.popd();
}