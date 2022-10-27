import { ethers } from "hardhat";
import { toHex, submitAndWait } from "./utils";

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

  const iouTokenAddress = await chief.IOU();
  const iou = await ethers.getContractAt("DSToken", iouTokenAddress);
  await submitAndWait(iou.connect(myAccount)["approve(address)"](chiefAddress));

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
  console.log("AddWeight");
  // 自分の承認残高がhatより大きくなるよう調整する
  await submitAndWait(
    chief.connect(myAccount).lock(hatApproval.sub(myDeposits).add(1))
  );
  console.log("Lift");
  // spellのlift
  console.log(`Unlocking funds`)
  await submitAndWait(chief.lift(spell.address));
  // lift後に引き抜く
  await submitAndWait(chief.connect(myAccount).free(hatApproval));
  const hatAfter = await chief.hat();
  const hatApprovalAfter = await chief.approvals(hatAfter);
  console.log(`hat after free ${hatAfter}, ${hatApprovalAfter}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
