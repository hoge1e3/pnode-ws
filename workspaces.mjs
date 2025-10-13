
import * as fs from "fs";
class Workspace {
    constructor(dir) {
        this.dir=dir;
        this.pkg=JSON.parse(fs.readFileSync(`${dir}/package.json`));
    }
    get name(){
        return this.pkg.name;
    }
    get dependencies(){
        return this.pkg.dependencies||{};
    }
    get version(){
        return this.pkg.version;
    }
    save(file=`${this.dir}/package.json`){
        fs.writeFileSync(file,JSON.stringify(this.pkg,null,2));    
    }
    depsInWs(n2ws) {
        const res=new Set();
        for (let [name,p] of n2ws) {
            if (this.dependencies[name]) {
                res.add(p);
            }
        }
        return res;
    }
}
export function load(){
    const pkg =  JSON.parse(fs.readFileSync('package.json', 'utf8'));
    //console.log(pkg.workspaces);
    const n2ws=new Map();
    for (let workspace of pkg.workspaces) {
        const p=new Workspace(workspace);
        n2ws.set(p.name, p);
    }
    return n2ws;
}

export function loadAsArray(){
    const pkg =  JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const res=[];
    for (let workspace of pkg.workspaces) {
        const p=new Workspace(workspace);
        res.push(p);
    }
    return res;
}