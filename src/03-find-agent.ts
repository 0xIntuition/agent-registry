import { gql, GraphQLClient } from 'graphql-request'
import { account } from './setup'
import { getAddress } from 'viem'


async function main() {
  const client = new GraphQLClient('http://localhost:8080/v1/graphql')
  const agents = await client.request(gql`
    query GetAgentsForAccount($address: String) {
      positions(where: {_and: [
        {account_id: {_eq: $address}}, 
        {shares: {_gt: 0}}, 
        {term: {triple: {predicate: {data: {_eq: "type"}}}}}, 
        {term: {triple: {object: {data: {_eq: "agent"}}}}}
      ]}) {
        account_id
        term {
          triple {
            subject {
              data
              claims: as_subject_triples(where: {_and: [
                {positions: {account_id: {_eq: $address}}}, 
                {positions: {shares: {_gt: 0}}}
              ]}) {
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
      }
    }`, { address: getAddress(account.address) })

  console.dir(agents, { depth: 10 })

}

main().catch(e => console.log(e.message))
