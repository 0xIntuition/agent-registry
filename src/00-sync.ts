import { sync, search } from './utils'
import { account } from './setup'

async function main() {


  const data = {
    'did:example:123': {
      type: 'agent',
      name: 'The Automatoa',
      description: 'Your ultimate ai assistant',
      url: 'https://example.com/a2a',
      capabilities: ['defi', 'web_search', 'file_search']
    },
    'did:example:456': {
      type: 'agent',
      name: 'Degen',
      description: 'Agent that can find best yield in crypto',
      url: 'https://degen.example.com/mcp',
      capabilities: ['defi', 'yield_farming']
    },
    'did:example:789': {
      type: 'agent',
      name: 'Alice Smithaaa',
      description: 'Example description',
      url: 'https://alice1.example.com/mcp',
      capabilities: ['web_search']
    }

  }

  await sync(data)

  const result = await search([
    { type: 'agent' },
    // { capabilities: 'yield_farming' },
    // { capabilities: 'web_search' },
  ], [account.address])

  console.dir(result, { depth: 10 })

}

main().catch(e => console.error(e.message))


