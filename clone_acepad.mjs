
import * as fs from "fs";
import * as process from 'process';
import * as cp from 'child_process';
let me=process.argv.includes("-me");//Options just for me, @hoge1e3 :-)
const tourl=(name)=>me?`git@github.com:hoge1e3/${name}.git`:`https://github.com/hoge1e3/${name}.git`
for (let workspace of ["pnode-bootkit"]) {
  console.log(workspace); 
  const url=tourl(workspace);
  cp.execSync(`git clone ${url}`, {stdio: 'inherit'});
}
{
  fs.mkdirSync("./idb/run",{recursive:true});
  process.chdir("./idb/run/");
  const name="acepad-dev";
  const url=tourl(name);
  cp.execSync(`git clone ${url} .`, {stdio: 'inherit'});
}
