import { assign } from './utils'

async function main() {

  const id = 'did:example:123'

  await assign(id, 'type', 'agent')
  await assign(id, 'name', 'The Automator')
  await assign(id, 'description', 'Your ultimate ai assistant')
  await assign(id, 'url', 'https://example.com/a2a')
  await assign(id, 'capabilities', 'defi')
  await assign(id, 'capabilities', 'web_search')
  await assign(id, 'capabilities', 'file_search')


  const id2 = 'did:example:456'

  await assign(id2, 'type', 'agent')
  await assign(id2, 'name', 'Degen')
  await assign(id2, 'description', 'Agent that can find best yield in crypto')
  await assign(id2, 'url', 'https://degen.example.com/mcp')
  await assign(id2, 'capabilities', 'defi')
  await assign(id2, 'capabilities', 'yield_farming')
}

main().catch(console.error)
