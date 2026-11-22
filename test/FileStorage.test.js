const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FileStorage", function () {
  it("starts with no files", async function () {
    const storage = await ethers.deployContract("FileStorage");
    expect(await storage.fileCount()).to.equal(0n);
  });

  it("stores the first file under ID 1 and leaves ID 0 empty", async function () {
    const [uploader] = await ethers.getSigners();
    const storage = await ethers.deployContract("FileStorage");
    await storage.uploadFile("a.txt", "hash-a", 10);

    expect(await storage.fileCount()).to.equal(1n);
    const [name, hash, size, fileUploader] = await storage.files(1);
    expect([name, hash, size, fileUploader]).to.deep.equal(["a.txt", "hash-a", 10n, uploader.address]);

    const [emptyName, , , emptyUploader] = await storage.files(0);
    expect(emptyName).to.equal("");
    expect(emptyUploader).to.equal(ethers.ZeroAddress);
  });

  it("numbers files 1 to fileCount in upload order", async function () {
    const storage = await ethers.deployContract("FileStorage");
    const names = ["a.txt", "b.txt", "c.txt"];
    for (const name of names) {
      await storage.uploadFile(name, `hash of ${name}`, 1);
    }

    const count = await storage.fileCount();
    expect(count).to.equal(BigInt(names.length));
    for (let id = 1; id <= Number(count); id++) {
      const [name] = await storage.getFile(id);
      expect(name).to.equal(names[id - 1]);
    }
  });

  it("emits FileUploaded with the new ID", async function () {
    const [uploader] = await ethers.getSigners();
    const storage = await ethers.deployContract("FileStorage");
    await storage.uploadFile("a.txt", "hash-a", 10);
    await expect(storage.uploadFile("b.txt", "hash-b", 20))
      .to.emit(storage, "FileUploaded")
      .withArgs(2, "b.txt", "hash-b", 20, uploader.address);
  });
});
