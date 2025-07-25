import { revoke, assign } from './utils'

async function main() {

  const id = 'did:example:123'

  await revoke(id, 'capabilities', 'web_search')

  await revoke(id, 'name', 'The Automator')
  await assign(id, 'name', 'The Ultimate Automator')

}

main().catch(e => console.error(e.message))
