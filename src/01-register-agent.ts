import { signal } from './utils'

async function main() {

  const subject = 'did:example:123'

  await signal(subject, 'name', 'The Automator')
  await signal(subject, 'url', 'https://example.com/a2a')
  await signal(subject, 'capabilities', 'defi')
  await signal(subject, 'capabilities', 'web_search')

}

main().catch(console.error)
