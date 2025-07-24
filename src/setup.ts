import {
  Address,
  createPublicClient,
  createWalletClient,
  defineChain,
  getAddress,
  getContract,
  http,
  parseEther,
} from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { EthMultiVaultAbi } from '@0xintuition/protocol'
import { gql, GraphQLClient } from 'graphql-request'
import {
  getEthMultiVaultAddressFromChainId
} from '@0xintuition/sdk'

export const graphqlClient = new GraphQLClient('http://localhost:8080/v1/graphql')

const local = defineChain({
  id: 1337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
})

export const publicClient = createPublicClient({
  chain: local,
  // chain: baseSepolia,
  transport: http(),
})

const adminAccount = privateKeyToAccount(
  '0x3c0afbd619ed4a8a11cfbd8c5794e08dc324b6809144a90c58bc0ff24219103b',
)
export const account = privateKeyToAccount(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
)
export const walletClient = createWalletClient({
  // chain: baseSepolia,
  chain: local,
  transport: http(),
  account: account,
})

const address = getAddress('0x63905907b7a082d2ab9fa7643adc925619259c47')
// const address =getEthMultiVaultAddressFromChainId(walletClient.chain.id) 

export const config = {
  walletClient,
  publicClient,
  address,
}

export const contract = getContract({
  abi: EthMultiVaultAbi,
  client: { public: publicClient, wallet: walletClient },
  address,
})

export async function faucet() {
  const adminWalletClient = createWalletClient({
    // chain: baseSepolia,
    chain: local,
    transport: http(),
    account: account,
  })

  await adminWalletClient.sendTransaction({
    account: adminAccount,
    value: parseEther('1'),
    to: account.address,
  })

}
