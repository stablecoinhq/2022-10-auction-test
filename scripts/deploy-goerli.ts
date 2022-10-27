import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { toHex, submitAndWait } from "./utils";

require("dotenv").config();

const submitFunc = (f: Promise<ContractTransaction>) => submitAndWait(f, 5);

// Goerliにデプロイする
async function main() {
  const [myAccount] = await ethers.getSigners();
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
  // ChiefがMKRトークンを引き出し可能にしておく
  await submitFunc(mkr["approve(address)"](chiefAddress));

  const myBalance = await mkr.balanceOf(myAccount.address);
  console.log(`My MKR balance ${myBalance}`);

  // spellのvote
  console.log("Vote");
  await submitFunc(chief["vote(address[])"]([spell.address]));

  // hatの承認残高
  const hat = await chief.hat();
  const hatApproval = await chief.approvals(hat);
  // 自分の承認残高
  const myDeposits = await chief.deposits(myAccount.address);
  console.log("AddWeight");
  // 自分の承認残高がhatより大きくなるよう調整する
  await submitFunc(chief.lock(hatApproval.sub(myDeposits).add(1)));
  console.log("Lift");
  // spellのlift
  await submitFunc(chief.lift(spell.address));
  // spellのスケジュール
  console.log("Schedule");
  await spell.schedule();
  // 確認
  const vowAddress = await dssExecLib.vow();
  console.log(`Vow address is ${vowAddress}`);
  const vow = await ethers.getContractAt("Vow", vowAddress);
  const sumpBefore = await vow.sump();

  // 2分待って実行する
  // spellの実行
  setTimeout(async () => {
    await submitFunc(spell.cast());
    const sumpAfter = await vow.sump();
    console.log(`Sump before: ${sumpBefore}`);
    console.log(`Sump after: ${sumpAfter}`);
  }, 120 * 10 ** 3);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
