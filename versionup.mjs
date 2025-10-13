import {create} from './shell.mjs';
import { shouldBeVerup } from './verup_check.mjs';
import { loadAsArray, load } from './workspaces.mjs';
const sh = await create();
const pkg = sh.rel("./package.json").obj();
console.log(pkg.workspaces);
const newver=pkg.version;
const workspaces=loadAsArray();
const n2ws=load();
const verupNeeds=new Set(); // of name
const dry=true;
const dryexec=async (...args)=>{
  if (dry) {
    console.log(process.cwd(),...args);
  } else {
    await sh.exec(...args);
  }
};
for (let workspace of workspaces) {
  console.log(workspace.dir); 
  try {
    sh.pushd(workspace.dir);
    if (!await shouldBeVerup(newver)) {
      for (let name in workspace.dependencies){
        if (verupNeeds.has(name)) {
          verupNeeds.add(workspace.name);
        }
      }
      if (!verupNeeds.has(workspace.name)) {
        console.log(process.cwd(),"Skip verup");
        continue;
      }
    }
    verupNeeds.add(workspace.name);
    let needsCommit=false;
    if (workspace.dir==="petit-node") {
      await manipulateVer();
      needsCommit=true;
    }
    if (await fixDepVer(workspace)) needsCommit=true;
    if (needsCommit) await commit();
    await dryexec("npm", ["version", newver],{nostdout:true});
  } finally {
    sh.popd();
  }
}
async function commit(){
  await dryexec("git",["commit", "-a", "-m", "Replace version string for "+newver],{nostdout:true});
}
async function manipulateVer(){
  if (dry) {
    console.log(process.cwd(), "Manipluate version to ",newver);
    return ;
  }
  const files=[sh.rel("src/index.ts"),sh.rel("js/index.js"),sh.rel("dist/index.js")];
  for (let file of files) {
    file.text(file.text().replace(/__VER__[\d\.]+__SION__/, `__VER__${newver}__SION__`));
  }
}
async function fixDepVer(workspace) {
  let hasChange=false;
  for (let dw of workspace.depsInWs(n2ws)) {
    if (verupNeeds.has(dw.name)) {
      workspace.pkg.dependencies[dw.name]=newver;
      hasChange=true;
    }
  }
  if (!hasChange) {
    console.log(process.cwd(), workspace.name, " has no deps-change.");
    return false;
  }
  if (dry) {
    console.log(process.cwd(), "change deps ",workspace.pkg.dependencies);
    return true;
  }
  workspace.save("./package.json");
  return true;
}
/*
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
}*/
//await sh.exec("npm",["run","publish"]);