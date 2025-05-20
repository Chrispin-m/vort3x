import { Contract, ethers } from "ethers";
import { parseEther } from "ethers";
import erc20Abi from "../abi/erc20.json"; // Ensure ABI is correct
import { cusdContractAddress, VortexAddress } from "./signer";

const SignTx = async (amount: string, signer: ethers.JsonRpcSigner) => {
  try {
    // Create a contract instance for the CUSD ERC20 token contract
    const contract = new Contract(cusdContractAddress, erc20Abi, signer);

    // Populate transaction data
    const txData = await contract.transfer.populateTransaction(
      VortexAddress,
      parseEther(amount)
    );

    // Add necessary fields for signing
    const fromAddress = await signer.getAddress();
    const provider = signer.provider;

    if (!provider) {
      throw new Error("Signer provider is not available");
    }

    const unsignedTx = {
      ...txData,
      from: fromAddress,
      nonce: await provider.getTransactionCount(fromAddress),
      gasLimit: await provider.estimateGas({
        ...txData,
        from: fromAddress,
      }),
     // gasPrice: await provider.getGasPrice(),
      chainId: (await provider.getNetwork()).chainId,
    };

    // Sign the transaction
    const signedTx = await signer.sendTransaction(unsignedTx);

    console.log("Signed Transaction:", signedTx);

    return {hash:signedTx.hash, signature:signedTx.signature,value:signedTx.value,amount:amount,userAddress:fromAddress};
  } catch (err) {
    console.error("Error signing transaction:", err);
    throw new Error(`Error signing transaction: ${err}`);
  }
};

export { SignTx };