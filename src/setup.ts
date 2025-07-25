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
import { GraphQLClient } from 'graphql-request'
import {
  getEthMultiVaultAddressFromChainId
} from '@0xintuition/sdk'


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

// const chain = local
// const address = getAddress('0x63905907b7a082d2ab9fa7643adc925619259c47')
// export const graphqlClient = new GraphQLClient('http://localhost:8080/v1/graphql')

const chain = baseSepolia
const address = getEthMultiVaultAddressFromChainId(chain.id)
export const graphqlClient = new GraphQLClient('https://prod.base-sepolia.intuition-api.com/v1/graphql')

export const publicClient = createPublicClient({
  chain,
  transport: http('https://base-sepolia.g.alchemy.com/v2/gJjddZIMVctgNU2HSQt940NiyT_KH8lX'),
})

export const account = privateKeyToAccount(
  '0x6c25488133b8ca4ba754ea64886b1bfa4c4b05e7fea057c61f9951fe76f1d657',
)
export const walletClient = createWalletClient({
  chain,
  transport: http('https://base-sepolia.g.alchemy.com/v2/gJjddZIMVctgNU2HSQt940NiyT_KH8lX'),
  account: account,
})

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


// This is needed only if running with local backend
const adminAccount = privateKeyToAccount(
  '0x3c0afbd619ed4a8a11cfbd8c5794e08dc324b6809144a90c58bc0ff24219103b',
)

export async function faucet() {
  const adminWalletClient = createWalletClient({
    chain,
    transport: http(),
    account: account,
  })

  await adminWalletClient.sendTransaction({
    account: adminAccount,
    value: parseEther('1'),
    to: account.address,
  })

}
