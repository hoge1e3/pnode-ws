import { execSync } from "child_process";

function runGitCommand(cmd, repoPath) {
    try {
        return execSync(cmd, { cwd: repoPath, encoding: "utf8" }).trim();
    } catch (error) {
        return null;
    }
}

function checkRepoStatus(repoPath) {
    const status = runGitCommand("git status --porcelain", repoPath);
    if (status) {
        console.log(repoPath,"未ステージまたは未コミットの変更があります。");
        process.exit(1);
    }
}

function checkRemoteUpdates(repoPath) {
    runGitCommand("git fetch", repoPath);
    const localAhead = runGitCommand("git rev-list --count HEAD @{u}..", repoPath) || "0";
    const remoteAhead = runGitCommand("git rev-list --count @{u} HEAD..", repoPath) || "0";
    return { localAhead: parseInt(localAhead, 10), remoteAhead: parseInt(remoteAhead, 10) };
}

function syncRepo(repoPath) {
    checkRepoStatus(repoPath);
    const { localAhead, remoteAhead } = checkRemoteUpdates(repoPath);

    if (localAhead > 0 && remoteAhead > 0) {
        console.log(repoPath,"ローカルにpushするものがあり、リモートにも更新があります。手動で解決してください。");
        process.exit(1);
    } else if (localAhead > 0) {
        console.log(repoPath,"ローカルの変更をリモートにプッシュします。");
        runGitCommand("git push", repoPath);
    } else if (remoteAhead > 0) {
        console.log(repoPath,"リモートの変更をローカルにプルします。");
        runGitCommand("git pull", repoPath);
    } else {
        console.log(repoPath,"リモートとの同期は必要ありません。");
    }
}

const repoPath = process.argv[2];
if (!repoPath) {
    console.error("使用法: node script.js <リポジトリのパス>");
    process.exit(1);
}

syncRepo(repoPath);
