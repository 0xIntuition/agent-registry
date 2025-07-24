import { notRelevant } from './utils'

async function main() {

  const id = 'did:example:123'

  await notRelevant(id, 'capabilities', 'web_search')
  await notRelevant(id, 'name', 'Autie')

}

main().catch(e => console.error(e.message))
