import { signal } from './utils'

async function main() {

  const id = 'did:example:123'

  await signal(id, 'type', 'agent')
  await signal(id, 'name', 'The Automator')
  await signal(id, 'name', 'Autie')
  await signal(id, 'description', 'Your ultimate ai assistant')
  await signal(id, 'url', 'https://example.com/a2a')
  await signal(id, 'capabilities', 'defi')
  await signal(id, 'capabilities', 'web_search')
  await signal(id, 'capabilities', 'file_search')
  await signal(id, 'foo', 'bar')

}

main().catch(console.error)
