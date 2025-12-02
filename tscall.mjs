#!run
export async function main(){
  const ndm=this.resolve("node_modules");
  const wss=this.resolve("package.json").obj().workspaces;
  for (let ws of wss) {
    this.cd(ws);
    const pkg=this.resolve("package.json").obj();
    const n=pkg.name;
    const nd=ndm.rel(n);
    if (!nd.exists()) {
      this.ln(this.resolve("."), nd);
    }
    //this.rm(".tsbuildinfo");
    const r=await this.tsc();
    this.echo(ws, r);
    this.cd("..");
  }
}