import { notRelevant } from './utils'

async function main() {

  const subject = 'did:example:123'

  await notRelevant(subject, 'capabilities', 'web_search')

}

main().catch(e => console.error(e.message))
