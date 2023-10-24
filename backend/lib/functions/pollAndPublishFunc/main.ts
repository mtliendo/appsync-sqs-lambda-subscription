import { publish as query } from '../../api/graphql/src/graphql/mutations'
import { Sha256 } from '@aws-crypto/sha256-js'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { SignatureV4 } from '@aws-sdk/signature-v4'
import { HttpRequest } from '@aws-sdk/protocol-http'
import { default as fetch, Request } from 'node-fetch'

type SQSRecord = {
	body: string
}

type ParsedBody = { message: string; appsyncUrl: string }

type RecordsObject = {
	Records: SQSRecord[]
}

exports.handler = async (event: RecordsObject) => {
	for (let record of event.Records) {
		const parsedBody = JSON.parse(record.body) as ParsedBody
		const endpoint = new URL(parsedBody.appsyncUrl)
		const signer = new SignatureV4({
			credentials: defaultProvider(),
			region: process.env.REGION || 'us-east-1',
			service: 'appsync',
			sha256: Sha256,
		})

		const requestToBeSigned = new HttpRequest({
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				host: endpoint.host,
			},
			hostname: endpoint.host,
			body: JSON.stringify({
				query,
				variables: { body: parsedBody.message },
			}),
			path: endpoint.pathname,
		})

		const signed = await signer.sign(requestToBeSigned)

		//* Long running task goes here
		await new Promise((resolve) => setTimeout(resolve, 10000)) // waits for 10 seconds

		//* end long running task
		const request = new Request(endpoint, signed)

		let statusCode = 200
		let body
		let response

		try {
			response = await fetch(request)
			body = (await response.json()) as any
			if (body.errors) statusCode = 400
			console.log(`Response Body: ${JSON.stringify(body)}`)
		} catch (error: any) {
			statusCode = 500
			body = {
				errors: [
					{
						message: error.message,
					},
				],
			}
		}

		return {
			statusCode,
			body: JSON.stringify(body),
		}
	}
}
