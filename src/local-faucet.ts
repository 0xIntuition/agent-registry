import { faucet } from './setup'

faucet()
  .then(() => console.log('Sent 10 ETH'))
  .catch(console.error)
