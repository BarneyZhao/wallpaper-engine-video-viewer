/* eslint-disable @typescript-eslint/no-var-requires */
// const inquirer = require("inquirer");
const ghpages = require("gh-pages");
const chalk = require("react-dev-utils/chalk");

const repo = require("../package.json").repository.url;
const branch = process.argv[2];

const successFunc = () => {
  console.log(chalk.green(` Success publish to ${branch} branch! \n`));
};

if (!["release"].includes(branch)) {
  console.log(`\n 分支名 ${branch} 不正确，应为 release \n`);
  return;
}

(async () => {
  //   let prompt = null;
  let message = `编译后，${branch}分支自动提交`;
  //   if (branch === "release") {
  //     console.log("\n");
  //     prompt = await inquirer.prompt([
  //       {
  //         name: "ans",
  //         message: "当前为 release 分支发布，请输入提交信息",
  //         validate: Boolean,
  //       },
  //     ]);
  //     message = prompt.ans;
  //   }
  console.log("\n");
  console.log(chalk.yellow(` Now publishing to the ${branch} branch... \n`));
  ghpages.publish(
    "dist",
    {
      branch,
      repo,
      dest: "docs/",
      message,
    },
    successFunc
  );
})();
