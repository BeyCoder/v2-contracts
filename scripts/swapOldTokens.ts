import {Address, beginCell, SendMode, toNano} from 'ton-core';
import { SwapToV2Contract } from '../wrappers/SwapToV2Contract';
import { NetworkProvider, sleep } from '@ton-community/blueprint';
import {JettonMaster, JettonWallet} from "ton";

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Contract address:'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const contract = provider.open(SwapToV2Contract.createFromAddress(address));

    const contractBefore = await contract.getBalances();

    const old_jetton_address = Address.parse("kQCKL0wsvuI83eVeKXHRgNNgFUBLsvCUpX1SFEoOyOxEx_nl");
    const old_masterContract_code = JettonMaster.create(old_jetton_address);
    const old_masterContract = provider.open(old_masterContract_code);
    const userAddress = provider.sender().address;
    if (!userAddress)
        return;
    const old_jetton_wallet_address = await old_masterContract.getWalletAddress(userAddress);

    const body = beginCell()
        .storeUint(0xf8a7ea5, 32)
        .storeUint(0, 64)
        .storeCoins(Number(100) * (10 ** 5))
        .storeAddress(address)
        .storeAddress(provider.sender().address)
        .storeUint(0, 1)
        .storeCoins(toNano("0.1"))
        .storeUint(0, 1)
        .storeUint(0, 32)
        .endCell();

    provider.sender().send({
        to: old_jetton_wallet_address,
        value: toNano("0.15"),
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        body
    });

    ui.write('Saving jetton wallets...');

    let contractAfter = await contract.getBalances();
    let attempt = 1;
    while (contractAfter === contractBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        contractAfter = await contract.getBalances();
        attempt++;
    }

    ui.clearActionPrompt();
    const wallets = await contract.getJettonWallets();
    ui.write('Jetton wallets saved successfully! Balances: ' + Number(contractAfter.old_jetton) / (10 ** wallets.old_jetton_decimals) + ` (${wallets.old_jetton_decimals}) OLDFCK, ` + Number(contractAfter.new_jetton) / (10 ** wallets.new_jetton_decimals)  + ` (${wallets.new_jetton_decimals}) NEWFCK`);
}