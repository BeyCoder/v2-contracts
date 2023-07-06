
# Jetton migration contract

This contract swaps old jettons to new jettons. Exchange rate is 1 = 1.

If balance of smart-contract is not enough for swap, contract will transfer old jettons back to user.
## Deployment

### 1. Compile contract
```bash
npx blueprint build
```

### 2. Deploy contract to blockchain
For testnet, add ```--testnet```
```bash
npx blueprint run deploySwapToV2Contract --tonconnect
```

### 3. Set old and new jetton wallets
```bash
npx blueprint run setJettonWallets --tonconnect
```


## Deposit

Then, you must deposit old and new jettons.

### Depositing OLD jettons:
```bash
npx blueprint run depositOldJettons --tonconnect 
```

### Depositing NEW jettons:
```bash
npx blueprint run depositNewJettons --tonconnect 
```
## Swap
For swap old jettons to new jettons, wallet must send Jetton tranfer to smart-contract with **forward fee >=0.1 TON** and message value must be **>=0.15 TON**

### Example
```ts
const old_jetton_address = Address.parse("<OLD JETTON ADDRESS>");
const old_masterContract_code = JettonMaster.create(old_jetton_address);
const old_masterContract = provider.open(old_masterContract_code);

const userAddress = provider.sender().address;
if (!userAddress)
    return;

const old_jetton_wallet_address = await old_masterContract.getWalletAddress(userAddress);

const body = beginCell()
        .storeUint(0xf8a7ea5, 32) // jetton transfer
        .storeUint(0, 64)
        .storeCoins(Number(AMOUNT) * (10 ** DECIMALS)) // amount and jetton decimals
        .storeAddress(address) // smart contract address (destination)
        .storeAddress(userAddress) // user address, excess will transfer here (response_destination)
        .storeUint(0, 1)
        .storeCoins(toNano("0.1")) // forward fee, must be >=0.1 TON
        .storeUint(0, 1)
        .storeUint(0, 32)
    .endCell();

    provider.sender().send({
        to: old_jetton_wallet_address,
        value: toNano("0.15"), // message value, must be >=0.15 TON
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        body
    });
```
## Authors

- [@BeyCoder](https://www.github.com/BeyCoder)


## Used By

This smart-contract is used by:

- [FCK (Find&Check)](https://fck.foundation)

