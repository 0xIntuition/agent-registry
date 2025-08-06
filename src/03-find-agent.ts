import { search } from './utils'
import { account } from './setup'

async function main() {

  const result = await search([
    { type: 'agent' },
    // { capabilities: 'yield_farming' },
    // { capabilities: 'web_search' },
  ], [account.address])

  console.dir(result, { depth: 10 })

}

main().catch(e => console.log(e.message))
