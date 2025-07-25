import { Address, keccak256, toHex } from 'viem'
import { contract, config, graphqlClient } from './setup'
import { createAtomFromString, createTripleStatement, depositTriple, redeemTriple } from '@0xintuition/sdk'
import { gql } from 'graphql-request'

export async function getOrCreateAtom(data: string) {
  const termId = await contract.read.atomsByHash([keccak256(toHex(data))])
  if (termId > 0) {
    console.log('Atom exists', data, termId)
    return termId
  } else {
    console.log('Creating atom', data)
    const result = await createAtomFromString(config, data)
    console.log('Atom created', data, result.state.vaultId)
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

    console.log('Triple exists', tripleId)

    // check if user has a position on this triple
    const [shares] = await contract.read.getVaultStateForUser(
      [tripleId, config.walletClient.account.address]
    )
    if (shares == 0n) {
      console.log('Account', config.walletClient.account.address, 'does not have a position on triple', tripleId, 'Depositing minimal amount')
      await depositTriple(config, {
        args: [config.walletClient.account.address, tripleId],
        value: generalConfig[3]
      })
    } else {
      console.log('Account', config.walletClient.account.address, 'holds', shares, 'shares on triple', tripleId)
    }
    return tripleId
  } else {
    console.log('Triple does not exist. Creating with min deposit')
    const result = await createTripleStatement(config, {
      args: [subjectId, predicateId, objectId],
      depositAmount: generalConfig[3]
    })
    return result
  }
}

export async function assign(
  subject: string,
  predicate: string,
  object: string
) {
  return await getOrCreateTriple(
    await getOrCreateAtom(subject),
    await getOrCreateAtom(predicate),
    await getOrCreateAtom(object),
  )
}


export async function revoke(
  subject: string,
  predicate: string,
  object: string
) {
  const subjectId = await contract.read.atomsByHash([keccak256(toHex(subject))])
  const predicateId = await contract.read.atomsByHash([keccak256(toHex(predicate))])
  const objectId = await contract.read.atomsByHash([keccak256(toHex(object))])

  const tripleHash = await contract.read.tripleHashFromAtoms(
    [subjectId, predicateId, objectId]
  )

  const tripleId = await contract.read.triplesByHash([tripleHash])
  if (tripleId) {
    console.log('Triple exists', tripleId, 'for atoms', subject, predicate, object)
    const [shares] = await contract.read.getVaultStateForUser(
      [tripleId, config.walletClient.account.address]
    )
    if (shares > 0n) {
      console.log('Account', config.walletClient.account.address, 'holds', shares, 'shares on triple', tripleId, '. Redeeming')

      await redeemTriple(config, { args: [shares, config.walletClient.account.address, tripleId] })

    }

  }
}

export async function search(searchFields: Array<Record<string, string>>, addresses: Address[]) {
  const response: any = await graphqlClient.request(gql`
    query SearchPositions($addresses: _text, $search_fields: jsonb) {
      positions: search_positions_on_subject(
        args: {addresses: $addresses, search_fields: $search_fields}
      ) {
        term {
          triple {
            subject {
              data
            }
            predicate {
              data
            }
            object {
              data
            }
          }
        }
      }
    }
    `, {
    addresses: `{${addresses.map(a => `"${a}"`).join(',')}}`,
    search_fields: searchFields
  })

  const result: Record<string, Record<string, string | string[]>> = {}

  for (const position of response.positions) {
    const triple = position.term.triple
    const id = triple.subject.data
    const predicate = triple.predicate.data
    const object = triple.object.data
    if (!result[id]) {
      result[id] = {}
    }
    if (typeof result[id][predicate] == 'string') {
      result[id][predicate] = [result[id][predicate], object]
    } else if (Array.isArray(result[id][predicate])) {
      result[id][predicate].push(object)
    } else {
      result[id][predicate] = object
    }
  }

  return result
}
