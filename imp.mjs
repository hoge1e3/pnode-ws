#!run
import * as e from "resolve.exports";
import * as fs from "fs";
import * as path from "path";

/*
    #!run
export async function main(){
  const base="/idb/pnode-ws/node_modules/ajv-formats";
  const codegen_1 = pNode.require(
    "ajv/dist/compile/codegen",base);
  console.log(codegen_1+"");
  const e=pNode.resolveEntry("require",
  "ajv/dist/compile/codegen",
  base);
  console.log("ent",e);
  return ;
}*/
const pkg={
  "exports2":{
    "./hoge":"./fuga.js"
  }
};
console.log(e.exports(pkg, "./hogee"));
/*
const pkg=JSON.parse(fs.readFileSync("node_modules/ajv-formats/node_modules/ajv/package.json","utf8"));
const c=resolveCJSRaw(pkg,"dist/compile/codegen");
console.log(pkg, c);
const d=e.resolve(pkg,"dist/compile/codegen",{require:true});
console.log(d);
*/
process.exit();


function resolveESRaw(pkg, path="."){
  try {
    return e.exports(pkg, path)[0];
  } catch(e){
    return undefined;
  }
}
function resolveCJSRaw(pkg, path="."){
  try {
    return e.exports(pkg, path, {require:true})[0];
  } catch(e){
    return undefined;
  }
}
function resolveLegacy(pkg){
  try {
    return e.legacy(pkg,{fields:["main"]});
  } catch(e){
    return undefined;
  }
}
function isESM(file) {
  if (file.endsWith(".cjs")) return false;
  if (file.endsWith(".mjs")) return true;
  const j=readClosestPackageJson(path.dirname(file));
  return j.type==="module";
}
function readClosestPackageJson(dir) {
  while(true){
    const r=readPackageJson(dir);
    if (r) return r;
    const nd=path.dirname(dir);
    if (nd===dir) throw new Error("no package.json");
    dir=nd;
  }
}
function readPackageJson(dir){
  const pf=path.join(dir,"package.json");
  if (!fs.existsSync(pf)) return;
  const pj=fs.readFileSync(pf,{encoding:"utf-8"});
  return JSON.parse(pj);
}
function resolveES(pkg_dir, subpath=".") {
  const pkg=readPackageJson(pkg_dir);
  const e=resolveESRaw(pkg,subpath)||resolveLegacy(pkg)||subpath;
  const f=pathFallback(path.join(pkg_dir,e));
  return f;
  if (isESM(f)) return {file: f, type:"ES"};
  const cjs=resolveCJS(pkg_dir, subpath);
  if (!cjs) return undefined;
  return {file: cjs, type:"CJS"};
}
function resolveCJS(pkg_dir, subpath=".") {
  const pkg=readPackageJson(pkg_dir);
  const c=resolveCJSRaw(pkg,subpath)||resolveLegacy(pkg)||subpath;
  const f=pathFallback(path.join(pkg_dir,c));
  return f;
  if (!isESM(f)) return f;
  return undefined;
}

export async function main(){
  const p={
      exports:{
        //".":{
          import:"./m.js",
          require:"./mr.js",
        //},
        //"./s":"./a.js"
        
      },
      main:"./m.js"
    };
  return e.resolve(p,
  ".",{
    //require:true
  }
  );
}
function detectModuleTypeScores(code) {
  const esmRegexes = [
    /\bimport\s+[\w*\s{},]+from\s+['"][^'"]+['"]/g,
    /\bimport\s*['"][^'"]+['"]/g,  // side-effect import
    /\bexport\s+(default|const|function|class|let|var)/g,
    /\bexport\s*{\s*[\w\s,]*\s*}/g,
    /\bimport\.meta\b/g
  ];

  const cjsRegexes = [
    /\brequire\s*\(\s*['"][^'"]+['"]\s*\)/g,
    /\bmodule\.exports\s*=/g,
    /\bexports\.[A-Za-z0-9_]+\s*=/g
  ];

  let esmScore = 0;
  let cjsScore = 0;

  for (const re of esmRegexes) {
    const matches = code.match(re);
    if (matches) esmScore += matches.length;
  }

  for (const re of cjsRegexes) {
    const matches = code.match(re);
    if (matches) cjsScore += matches.length;
  }

  return { esmScore, cjsScore };
}
function pathFallback(p) {
  for (let np of [(p)=>p, (p)=>p+".js",(p)=>path.join(p,"index.js")]){
    if (fs.existsSync(np(p)) && !fs.statSync(np(p)).isDirectory() ) return np(p);
  }
  throw new Error(p+" is not existent");
}
function scanPat(dir) {
  const pf=path.join(dir,"package.json");
  if (!fs.existsSync(pf)) return;
  const pj=fs.readFileSync(pf,{encoding:"utf-8"});
  const pkg=JSON.parse(pj);
  /*const vals=[undefined];
  function id(str){
    console.log(str);
    if (Array.isArray(str)) {
      if (str.length>1) console.log(str,pkg.name, pkg.exports);
      str=str[0];
    }
    //console.log(str);
    let r=vals.indexOf(str);
    if (r>=0) return r;
    vals.push(str);
    return vals.length-1;
  }
  console.log(dir,
    `${id(resolveESRaw(pkg))}${id(resolveCJSRaw(pkg))}${id(resolveLegacy(pkg))}${pkg.type}`);
  */
  const subs=[];
  if (pkg.exports) {
    for (var k in pkg.exports){
      if (k.startsWith(".")) subs.push(k);
    }
  }
  if (subs.length==0) subs.push(".");
  for (let sub of subs) {
    const e= resolveES(dir, sub) ;
    const c= resolveCJS(dir, sub);
    console.log(pkg.name, sub);
    if (!e&&!c) console.log("Neither e and c");
    if (e && !e.endsWith(".json")) {
      const mt=detectModuleTypeScores(fs.readFileSync(e,{encoding:"utf-8"}));
      if (isESM(e) && mt.cjsScore>0) console.log("E", e, mt);
      if (!isESM(e) && mt.esmScore>0) console.log("C", e, mt);
      /*if (e.type==="ES" && mt.cjsScore>0) console.log("E", e, mt);
      if (e.type==="CJS" && mt.esmScore>0) console.log("C", e, mt);*/
    }
    if (c && !c.endsWith(".json")) {
      const mt=detectModuleTypeScores(fs.readFileSync(c,{encoding:"utf-8"}));
      if (isESM(c)) console.log("CC", c, mt);
      if (mt.esmScore>0) console.log("C", c, mt);
    }
    //, e && pathFallback(path.join(dir,e)), c && pathFallback(path.join(dir,c)) ); 

  }
}
//scanPat("node_modules/terser");
const skip={
  "node-releases":1,"undici-types":1,
}
for (let d of fs.readdirSync("node_modules")) {
  if (skip[d]) continue;
  scanPat(`node_modules/${d}`);

}
