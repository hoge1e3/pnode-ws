import {create} from './shell.mjs';
const sh = await create();
const pkg = sh.rel("./package.json").obj();
console.log(pkg.workspaces);
const ver="1.2.8";
for (let workspace of pkg.workspaces) {
  //const p = await exec("npm", ["publish", "--workspaces", workspace], {cwd: home.rel(workspace).path()});
  //console.log(workspace, home.rel(workspace).rel("package.json").obj().version);// = pkg.version;
  console.log(workspace); 
  sh.pushd(workspace);
  await sh.exec("npm", ["version", ver]);
  sh.popd();
}