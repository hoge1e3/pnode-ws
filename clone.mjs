import {create} from './shell.mjs';
const sh = await create();
const pkg = sh.rel("./package.json").obj();
console.log(pkg.workspaces);
for (let workspace of pkg.workspaces) {
  console.log(workspace); 
  //sh.pushd(workspace);
  await sh.exec("git", ["clone", `git@github.com:hoge1e3/${workspace}.git`]);
  //sh.popd();
}