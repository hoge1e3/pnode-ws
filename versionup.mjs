import {create} from './shell.mjs';
const sh = await create();
const pkg = sh.rel("./package.json").obj();
console.log(pkg.workspaces);
const ver=pkg.version;
const subpkgNames=new Set();

for (let workspace of pkg.workspaces) {
  console.log(workspace); 
  sh.pushd(workspace);
  try {
    await sh.exec("npm", ["version", ver]);
  } catch(e) {
    console.error(e);
  }
  sh.popd();
}
const pnode=sh.rel("petit-node");
const files=[pnode.rel("src/index.ts"),pnode.rel("js/index.js"),pnode.rel("dist/index.js")];
for (let file of files) {
  file.text(file.text().replace(/__VER__[\d\.]+__SION__/, `__VER__${ver}__SION__`));
}

for (let workspace of pkg.workspaces) {
  const p=sh.rel(workspace).rel("package.json").obj();
  subpkgNames.add(p.name);
}
for (let workspace of pkg.workspaces) {
  const pf = sh.rel(workspace).rel("package.json");
  const p=pf.obj();
  if (!p.dependencies) continue;
  for (let pn in p.dependencies) {
    if (subpkgNames.has(pn)) {
      p.dependencies[pn]="^"+ver;
    }
  }
  //console.log(workspace, p.dependencies);
  pf.obj(p);
}
//await sh.exec("npm",["run","publish"]);