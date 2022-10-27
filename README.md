# オークション入札試験

- Goerli 上のチェーンをフォークして、投票を用いたオークション関連のパラメーター変更を行う

CHAINLOG: 0xA25435EFc77767e17CB41dA5c33685d6bDEc1f61

## 実行

以下の`.env`ファイルを用意する。鍵は Infura に登録して取得する

```
INFURA_KEY="89d63f4a2dfa4f9e84fab526bf0d7915"
```

別のターミナルでチェーンをローカルでフォークさせる

```
npx hardhat node
```

デプロイする

```
npm run deploy
```

```terminal
Spell deployed at 0x9b49706BF270241d36CB347f6fd6F965e122B6C6
DssExecLib deployed at 0x3b9031804Ae87D776B7E4D954bF24047511934DA
My MKR balance 100000000000000000000000
Vote
MyDeposits 0
Hat approval 80000000000000000000000
AddWeight
Lift
Schedule
Vow address is 0xd3563E656734650251556E7604dd24C3da9342B3
Casting spell
Before
{
  sump: BigNumber { value: "50000000000000000000000000000000000000000000000000" },
  bump: BigNumber { value: "30000000000000000000000000000000000000000000000000" },
  hump: BigNumber { value: "60000000000000000000000000000000000000000000000000000" }
}
After
{
  sump: BigNumber { value: "100000000000000000000000000000000000000000000000" },
  bump: BigNumber { value: "1300000000000000000000000000000000000000000000000" },
  hump: BigNumber { value: "100000000000000000000000000000000000000000000000" }
}
```
