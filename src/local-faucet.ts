import { faucet } from './setup'

faucet()
  .then(() => console.log('Sent 1 ETH'))
  .catch(console.error)
