import { getOrCreateAtom, getOrCreateTriple } from './utils'

async function main() {

  await getOrCreateTriple(
    await getOrCreateAtom('did:example:123'),
    await getOrCreateAtom('name'),
    await getOrCreateAtom('The Automator'),
  )

  await getOrCreateTriple(
    await getOrCreateAtom('did:example:123'),
    await getOrCreateAtom('url'),
    await getOrCreateAtom('https://example.com/a2a'),
  )

  await getOrCreateTriple(
    await getOrCreateAtom('did:example:123'),
    await getOrCreateAtom('capabilities'),
    await getOrCreateAtom('defi'),
  )

  await getOrCreateTriple(
    await getOrCreateAtom('did:example:123'),
    await getOrCreateAtom('capabilities'),
    await getOrCreateAtom('web_search'),
  )


}

main().catch(console.error)
