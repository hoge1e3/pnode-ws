import {create} from './shell.mjs';
const sh = await create();
const pkg = sh.rel("./package.json").obj();
console.log(pkg.workspaces);
const ver="1.3.0";
for (let workspace of pkg.workspaces) {
  console.log(workspace); 
  sh.pushd(workspace);
  await sh.exec("npm", ["version", ver]);
  sh.popd();
}