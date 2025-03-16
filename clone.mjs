import {Shell} from './shell.mjs';
const sh = new Shell();
const pkg = sh.rel("./package.json").obj();
console.log(pkg.workspaces);
for (let workspace of pkg.workspaces) {
  console.log(workspace); 
  sh.pushd(workspace);
  await exec("git", ["clone", `git@github.com:hoge1e3/${workspace}.git`]);
  sh.popd();
}