
# Jetton IDO contract

This contract is used for IDO. 1 TON = PRICE

If balance of smart-contract is not enough for IDO, contract will transfer TON back to user.
## Deployment

### 1. Compile contract
```bash
npx blueprint build
```

### 2. Deploy contract to blockchain and enter the price
For testnet, add ```--testnet```
```bash
npx blueprint run deployIDO --tonconnect
```

### 3. Set jetton-wallet
```bash
npx blueprint run setIDOJettonWallet --tonconnect
```


## Deposit

### Depositing jettons:
```bash
npx blueprint run depositIDOJettons --tonconnect 
```


## Withdraw

### Withdraw TON:
```bash
npx blueprint run withdrawIDO --tonconnect
```

### Withdraw jettons:
```bash
npx blueprint run withdrawJettonsIDO --tonconnect
```


## Swap
```AMOUNT_OF_TON``` must be >= 1 TON. Method will automatically add **0.1 TON network fee**

### Example
```ts
const contract = provider.open(IDO.createFromAddress(address)); // contract address

contract.sendBuy(provider.sender(), {
    amount: toNano(AMOUNT_OF_TON)
})
```
## Authors

- [@BeyCoder](https://www.github.com/BeyCoder)


## Used By

This smart-contract is used by:

- [FCK (Find&Check)](https://fck.foundation)

