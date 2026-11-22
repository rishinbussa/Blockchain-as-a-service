const { subtask } = require("hardhat/config");
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require("hardhat/builtin-tasks/task-names");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

// Version of the solc package pinned in package.json.
const SOLC_VERSION = require("solc/package.json").version;

// Hardhat normally downloads the compiler. Point it at the solc package from
// npm instead, so the compiler version is pinned in package-lock.json and
// compiling needs no extra download.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args, hre, runSuper) => {
  if (args.solcVersion !== SOLC_VERSION) {
    return runSuper();
  }
  return {
    compilerPath: require.resolve("solc/soljson.js"),
    isSolcJs: true,
    version: SOLC_VERSION,
    longVersion: require("solc").version(),
  };
});

module.exports = {
  solidity: SOLC_VERSION,
  paths: {
    // The contracts sit next to the React code in src/.
    sources: "./src",
  },
};
