import {create} from './shell.mjs';
import { shouldBeVerup } from './verup_check.mjs';
const sh = await create();
const pkg = sh.rel("./package.json").obj();
console.log(pkg.workspaces);
const newver=pkg.version;
const subpkgNames=new Map();

for (let workspace of pkg.workspaces) {
  console.log(workspace); 
  sh.pushd(workspace);
  try {
    if (!await shouldBeVerup(newver)) continue;
    if (workspace==="petit-node") {
      await manipulateVer();
    }
    await sh.exec("npm", ["version", newver]);
  } catch(e) {
    console.error(e);
  }
  sh.popd();
}
async function manipulateVer(){
  //sh.pushd("petit-node");
  //const pnode=sh.rel("petit-node");
  const files=[sh.rel("src/index.ts"),sh.rel("js/index.js"),sh.rel("dist/index.js")];
  for (let file of files) {
    file.text(file.text().replace(/__VER__[\d\.]+__SION__/, `__VER__${newver}__SION__`));
  }
  await sh.exec("git",["commit", "-a", "-m", "Replace version string for "+newver],{nostdout:true});
  //sh.popd();
}

for (let workspace of pkg.workspaces) {
  const p=sh.rel(workspace).rel("package.json").obj();
  subpkgNames.set(p.name, p.version);
}
for (let workspace of pkg.workspaces) {
  const pf = sh.rel(workspace).rel("package.json");
  const p=pf.obj();
  if (!p.dependencies) continue;
  for (let pn in p.dependencies) {
    if (subpkgNames.has(pn)) {
      p.dependencies[pn]="^"+subpkgNames.get(pn);
    }
  }
  //console.log(workspace, p.dependencies);
  pf.obj(p);
}
//await sh.exec("npm",["run","publish"]);