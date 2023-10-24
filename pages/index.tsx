import {
	Button,
	Flex,
	Heading,
	Input,
	Label,
	Text,
	View,
	withAuthenticator,
} from '@aws-amplify/ui-react'
import { useEffect, useState } from 'react'
import '@aws-amplify/ui-react/styles.css'
import { API } from 'aws-amplify'
import { sendMessage } from '@/backend/lib/api/graphql/src/graphql/mutations'
import {
	OnPublishSubscription,
	SendMessageMutation,
	SendMessageMutationVariables,
} from '@/backend/lib/api/graphql/src/API'
import { GraphQLQuery, GraphQLSubscription } from '@aws-amplify/api'
import { onPublish } from '@/backend/lib/api/graphql/src/graphql/subscriptions'

type HomeProps = {
	signOut: () => void
}

function Home({ signOut }: HomeProps) {
	const [longMsg, setLongMsg] = useState<string | undefined | null>('')
	const [currMessage, setCurrMessage] = useState('')
	const [currResult, setCurrResult] = useState<string | undefined>('')

	useEffect(() => {
		// subscribe to published messages
		const sub = API.graphql<GraphQLSubscription<OnPublishSubscription>>({
			query: onPublish,
		}).subscribe({
			next: ({ provider, value }) => {
				console.log({ provider, value })
				setLongMsg(value.data?.onPublish)
			},
			error: (e) => console.error(e),
		})
		return () => sub.unsubscribe()
	})

	const handleMakeRequest = async () => {
		//Make call to API
		const variables: SendMessageMutationVariables = {
			msg: currMessage,
		}

		const res = await API.graphql<GraphQLQuery<SendMessageMutation>>({
			query: sendMessage,
			variables,
		})

		//If this was a request that took too long, it would timeout.
		// Fortunately we have our subscription in the `useEffect` above.
		setCurrResult(res.data?.sendMessage)
	}
	return (
		<>
			<Button variation="destructive" onClick={signOut}>
				Sign Out
			</Button>
			<Flex justifyContent={'center'} alignItems={'center'} height={'90vh'}>
				<View maxWidth={'30vw'}>
					<Flex direction={'column'}>
						<Label>
							The request
							<Input
								value={currMessage}
								onChange={(e) => setCurrMessage(e.target.value)}
							/>
						</Label>
						<Button onClick={handleMakeRequest} variation="primary">
							Make a request
						</Button>
						<Heading level={3}>View the results</Heading>
						<Text>Immeadiate Response from SQS: {currResult}</Text>
						<Text>
							The Subscription that fires from the long running task (10s):{' '}
							{longMsg}
						</Text>
					</Flex>
				</View>
			</Flex>
		</>
	)
}

export default withAuthenticator(Home, { signUpAttributes: ['email'] })
