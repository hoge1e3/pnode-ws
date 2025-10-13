
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
    //console.log(ord.map(o=>o.name));
    return ord;
}
