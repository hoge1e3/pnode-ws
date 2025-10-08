
import * as fs from "fs";
import * as process from 'process';
import * as cp from 'child_process';
//const sh = await create();
// read package.json of current dir
const pkg =  JSON.parse(fs.readFileSync('package.json', 'utf8'));
let me=process.argv.includes("-me");//Options just for me, @hoge1e3 :-)
console.log(pkg.workspaces);
for (let workspace of pkg.workspaces) {
  console.log(workspace); 
  const url=me?`git@github.com:hoge1e3/${workspace}.git`:`https://github.com/hoge1e3/${workspace}.git`
  // run git clone $url
  cp.execSync(`git clone ${url}`, {stdio: 'inherit'});
}