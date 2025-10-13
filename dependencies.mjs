
import * as fs from "fs";
class Package {
    constructor(dir) {
        this.wpkg=JSON.parse(fs.readFileSync(`${dir}/package.json`));
        this.name=this.wpkg.name;
        this.dependencies=this.wpkg.dependencies||{};
    }
    depsInWs(pkgs) {
        const res=new Set();
        for (let [name,p] of pkgs) {
            if (this.dependencies[name]) {
                res.add(p);
            }
        }
        return res;
    }
}
export function list() {
    const pkg =  JSON.parse(fs.readFileSync('package.json', 'utf8'));
    //console.log(pkg.workspaces);
    const pkgs=new Map();
    for (let workspace of pkg.workspaces) {
        const p=new Package(workspace);
        pkgs.set(p.name, p);
    }
    function order(p, ord=[]) {
        if (ord.includes(p)) return;
        for (let d of p.depsInWs(pkgs)) {
            order(d, ord);
        }
        ord.push(p);
        return ord;
    }
    const ord=[];
    for (let [name, p] of pkgs) {
        order(p,ord);
    }
    pkg.workspaces=(ord.map(o=>o.name));
    fs.writeFileSync("./package.json",JSON.stringify(pkg,null,2));
    console.log("Fixed workspace order as: ", pkg.workspaces);
    return ord;
}
list();