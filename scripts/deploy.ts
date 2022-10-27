import { ethers } from "hardhat";
import { Vow } from "../typechain-types/contracts/Vow.sol/Vow";
import { toHex, submitAndWait } from "./utils";

async function getVowState(vow: Vow) {
  const sump = await vow.sump();
  const bump = await vow.bump();
  const hump = await vow.hump();
  return {
    sump,
    bump,
    hump,
  };
}
async function main() {
  // deploy spell
  const DssExecLib = await ethers.getContractFactory("DssExecLib");
  const dssExecLib = await DssExecLib.deploy();
  await dssExecLib.deployed();
  const Spell = await ethers.getContractFactory("DssSpell", {
    libraries: { DssExecLib: dssExecLib.address },
  });
  const spell = await Spell.deploy();
  await spell.deployed();
  console.log(`Spell deployed at ${spell.address}`);
  console.log(`DssExecLib deployed at ${dssExecLib.address}`);
  const chiefAddress = await dssExecLib.getChangelogAddress(toHex("MCD_ADM"));
  const chief = await ethers.getContractAt("DSChief", chiefAddress);
  const mkrTokenAddress = await chief.GOV();
  const mkr = await ethers.getContractAt("DSToken", mkrTokenAddress);
  // 自分のアカウント(0x24bbfC323FC8f0e09aB7B433Cc8408c75dac8193)乗っ取る
  const myAccount = await ethers.getImpersonatedSigner(
    "0x24bbfC323FC8f0e09aB7B433Cc8408c75dac8193"
  );
  // ChiefがMKRトークンを引き出し可能にしておく
  await submitAndWait(mkr.connect(myAccount)["approve(address)"](chiefAddress));

  const myBalance = await mkr.balanceOf(myAccount.address);
  console.log(`My MKR balance ${myBalance}`);

  // spellのvote
  console.log("Vote");
  await submitAndWait(
    chief.connect(myAccount)["vote(address[])"]([spell.address])
  );

  // hatの承認残高
  const hat = await chief.hat();
  const hatApproval = await chief.approvals(hat);
  // 自分の承認残高
  const myDeposits = await chief.deposits(myAccount.address);
  console.log(`MyDeposits ${myDeposits}`);
  console.log(`Hat approval ${hatApproval}`);
  console.log("AddWeight");

  if (hatApproval.gte(myDeposits)) {
    // 自分の承認残高がhatより大きくなるよう調整する
    await submitAndWait(
      chief.connect(myAccount).lock(hatApproval.sub(myDeposits).add(1))
    );
    console.log("Lift");
  }

  // spellのlift
  await submitAndWait(chief.lift(spell.address));
  // spellのスケジュール
  console.log("Schedule");
  await spell.schedule();
  const vowAddress = await dssExecLib.vow();
  console.log(`Vow address is ${vowAddress}`);
  const vow = await ethers.getContractAt("Vow", vowAddress);
  const before = await getVowState(vow);

  // 2分待って実行する
  // spellの実行
  console.log("Casting spell");
  await ethers.provider.send("evm_increaseTime", [120]);
  await ethers.provider.send("evm_mine", []);
  await submitAndWait(spell.cast());
  const after = await getVowState(vow);
  console.log("Before");
  console.log(before);
  console.log("After")
  console.log(after)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
