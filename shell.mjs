import {getNodeFS} from "@hoge1e3/sfile";
import {spawn} from "child_process";
export async function create() {
    return new Shell(await getHome());
}
export class Shell {
    constructor(home) {
        this.cwd = home;
        this.cds=[];
    }
    rel(path) {
        return this.cwd.rel(path);
    }
    pushd(path) {
        this.cds.push(this.cwd);
        this.cwd = this.cwd.rel(path);
    }
    popd() {
        this.cwd = this.cds.pop();
    }
    cd(path) {
        this.cwd = this.cwd.rel(path);
    }
    exec(cmd, args, options={}) {
        return exec(cmd, args, {cwd: this.cwd.path(), ...options});
    }
}
export function exec(cmd, args, options={}) {
    return new Promise((resolve, reject) => {
      const p = spawn(cmd, args, {shell:true,...options});
      let stdoutData = '';
      // Collect stdout data
      p.stdout.on('data', (data) => {
        console.log(data);
        stdoutData += data.toString();
      });
      p.stderr.pipe(process.stderr);
      p.on("exit", code => code ? reject(code) : resolve(stdoutData));
    });
  }   
export async function getHome() {
    const home = (await getNodeFS()).get(".");
    return home;
}
