const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EtherTransfer", function () {
  const ONE_ETH = ethers.parseEther("1");

  // Deploys the contract from the first account and funds it with 1 ETH.
  async function deployFunded() {
    const [owner, other] = await ethers.getSigners();
    const transfer = await ethers.deployContract("EtherTransfer");
    await other.sendTransaction({ to: await transfer.getAddress(), value: ONE_ETH });
    return { transfer, owner, other };
  }

  it("stores the deployer as owner", async function () {
    const { transfer, owner } = await deployFunded();
    expect(await transfer.owner()).to.equal(owner.address);
  });

  it("lets the owner withdraw the whole balance", async function () {
    const { transfer, owner } = await deployFunded();
    await expect(transfer.withdraw()).to.changeEtherBalances([owner, transfer], [ONE_ETH, -ONE_ETH]);
  });

  it("rejects a withdraw from any other account", async function () {
    const { transfer, other } = await deployFunded();
    await expect(transfer.connect(other).withdraw()).to.be.revertedWith(
      "Only the owner can call this function."
    );
    expect(await ethers.provider.getBalance(transfer)).to.equal(ONE_ETH);
  });

  it("forwards Ether with sendEther and emits TransferSuccessful", async function () {
    const { transfer, owner, other } = await deployFunded();
    const amount = ethers.parseEther("0.5");
    const tx = transfer.sendEther(other.address, { value: amount });
    await expect(tx).to.emit(transfer, "TransferSuccessful").withArgs(owner.address, other.address, amount);
    await expect(tx).to.changeEtherBalances([owner, other], [-amount, amount]);
  });

  it("reverts with a clear error when the recipient rejects Ether", async function () {
    const { transfer } = await deployFunded();
    // FileStorage has no receive or fallback function, so it rejects plain Ether.
    const storage = await ethers.deployContract("FileStorage");
    await expect(transfer.sendEther(await storage.getAddress(), { value: 1n })).to.be.revertedWith(
      "Transfer failed."
    );
  });
});
