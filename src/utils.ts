import { keccak256, toHex } from 'viem'
import { contract, config } from './setup'
import { createAtomFromString, createTripleStatement } from '@0xintuition/sdk'

export async function getOrCreateAtom(data: string) {
  const termId = await contract.read.atomsByHash([keccak256(toHex(data))])
  if (termId > 0) {
    return termId
  } else {
    const result = await createAtomFromString(config, data)
    return result.state.vaultId
  }
}

export async function getOrCreateTriple(
  subjectId: bigint,
  predicateId: bigint,
  objectId: bigint
) {

  const generalConfig = await contract.read.generalConfig()

  const tripleHash = await contract.read.tripleHashFromAtoms(
    [subjectId, predicateId, objectId]
  )

  const tripleId = await contract.read.triplesByHash([tripleHash])
  if (tripleId) {
    return tripleId
  } else {
    const result = await createTripleStatement(config, {
      args: [subjectId, predicateId, objectId],
      depositAmount: generalConfig[3]
    })
    return result
  }
}
