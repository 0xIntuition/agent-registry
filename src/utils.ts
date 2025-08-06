import { Address, keccak256, parseEther, toHex } from 'viem'
import { contract, config, graphqlClient } from './setup'
import {
  createAtomFromString, createTripleStatement, depositTriple, redeemTriple,
  batchCreateAtom, batchCreateTriple
} from '@0xintuition/sdk'
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


export async function findAtomIds(atoms: string[]) {
  const response: any = await graphqlClient.request(gql`
    query FindAtomIds($where: atoms_bool_exp = {}) {
      atoms(where: $where) {
        term_id
        data
      }
    }
    `, {
    where: { data: { _in: atoms } }
  })
  return response.atoms
}

export async function wait(hash: string | null) {
  if (hash === null) {
    return
  }
  const promise = new Promise(async (resolve, reject) => {
    let count = 0
    while (true) {
      console.log(`Waiting for transaction http://localhost/tx/${hash}`)
      console.log(`Count: ${count}`)
      const data: any = await graphqlClient.request(gql`
        query GetTransactionEvents($hash: String!) {
          events(where: { transaction_hash: { _eq: $hash } }) {
            transaction_hash
          }
        }
      `, { hash });
      if (data?.events.length > 0) {
        console.log('Transaction picked up by the BE, waiting additional 2secs for good measure')
        await new Promise(resolve => setTimeout(resolve, 2000));
        return resolve(true);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      count++
      if (count > 3600) {
        return reject(new Error('Transaction not found'))
      }
    }
  });
  return promise;
}


export async function findTripleIds(triplesWithAtomIds: Array<Array<string>>) {
  const response: any = await graphqlClient.request(gql`
    query FindTriples($where: triples_bool_exp = {}, $address: String!) {
      triples(where: $where) {
        term_id
        subject_id
        predicate_id
        object_id
        positions(where: {account_id: {_eq: $address}}) {
          shares
        }
      }
    }
  `, {
    address: config.walletClient.account.address,
    where: {
      _or: triplesWithAtomIds.map(t => ({
        _and: [
          { subject_id: { _eq: t[0] } },
          { predicate_id: { _eq: t[1] } },
          { object_id: { _eq: t[2] } }
        ]
      }))
    }
  })
  return response.triples
}

export async function sync(data: Record<string, Record<string, string | string[]>>) {

  const atoms = new Set<string>()
  const triples = new Map<string, Array<string>>()

  // figure out which atoms don't exist
  for (let subject of Object.keys(data)) {
    atoms.add(subject)
    // iterate over key-values
    for (let predicate of Object.keys(data[subject])) {
      atoms.add(predicate)
      const object = data[subject][predicate]
      // check if object is string or Array<string>
      if (typeof object === 'string') {
        atoms.add(object)
        triples.set(`${subject}|${predicate}|${object}`, [subject, predicate, object])
      } else if (Array.isArray(object)) {
        for (let item of object) {
          if (typeof item === 'string') {
            atoms.add(item)
            triples.set(`${subject}|${predicate}|${item}`, [subject, predicate, item])
          }
        }
      }
    }
  }

  console.log({ atoms })
  const searchResult = await findAtomIds(Array.from(atoms))
  console.log(searchResult)
  const nonExistingAtoms: string[] = []
  for (let atom of atoms) {
    if (!searchResult.find(i => i.data === atom)) {
      nonExistingAtoms.push(atom)
    }
  }

  console.log({ nonExistingAtoms })
  const generalConfig = await contract.read.generalConfig()

  // Create missing atoms
  if (nonExistingAtoms.length > 0) {
    const txHash = await batchCreateAtom(config, {
      args: [nonExistingAtoms.map(data => toHex(data))],
      value: generalConfig[3] * BigInt(nonExistingAtoms.length)
    })
    console.log(txHash)
    await wait(txHash)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const atomsWithIds = await findAtomIds(Array.from(atoms))
  console.log({ atomsWithIds })

  // figure out which triples don't exist
  console.log({ triples })

  // convert "text triples" into "atomId triples"

  const triplesWithAtomIds: Array<Array<string>> = []

  for (let triple of triples.values()) {
    console.log('triple[0]', triple[0])
    console.log('triple[1]', triple[1])
    console.log('triple[2]', triple[2])
    const subjectAtom = atomsWithIds.find(a => a.data === triple[0])
    const predicateAtom = atomsWithIds.find(a => a.data === triple[1])
    const objectAtom = atomsWithIds.find(a => a.data === triple[2])

    if (!subjectAtom || !predicateAtom || !objectAtom) {
      console.error('Missing atom for triple:', triple)
      continue
    }

    triplesWithAtomIds.push([
      subjectAtom.term_id,
      predicateAtom.term_id,
      objectAtom.term_id,
    ])
  }

  console.log({ triplesWithAtomIds })

  const tripleIds = await findTripleIds(triplesWithAtomIds)
  console.log({ tripleIds })

  // which triples are missing?
  const missingTriples: Array<Array<string>> = []

  for (let triple of triplesWithAtomIds) {
    if (!tripleIds.find(t =>
      String(t.subject_id) === triple[0]
      && String(t.predicate_id) === triple[1]
      && String(t.object_id) === triple[2])) {
      missingTriples.push(triple)
    }
  }

  console.log({ missingTriples })

  // create missing triples

  if (missingTriples.length > 0) {
    const triple_tx_hash = await batchCreateTriple(config, {
      args: [
        missingTriples.map(t => BigInt(t[0])),
        missingTriples.map(t => BigInt(t[1])),
        missingTriples.map(t => BigInt(t[2])),
      ],
      value: generalConfig[3] * BigInt(missingTriples.length)
    })

    console.log({ triple_tx_hash })
    await wait(triple_tx_hash)

  }

  // figure out which triples don't have user's position
  return true
}
