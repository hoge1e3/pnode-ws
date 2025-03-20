import {create} from './shell.mjs';
const sh = await create();
const pkg = sh.rel("./package.json").obj();
console.log(pkg.workspaces);
const otp = process.argv[2];
if (!otp) throw new Error("Please specify otp from Authenticater App.");
for (let workspace of pkg.workspaces) {
  console.log(workspace); 
  //sh.pushd(workspace);
  await sh.exec("npm", ["publish", "--access=public", "--workspace", workspace, "--otp", otp]);
  //sh.popd();
}