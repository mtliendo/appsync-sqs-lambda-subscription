import { Construct } from 'constructs'
import {
	AmplifyGraphqlApi,
	AmplifyGraphqlDefinition,
} from '@aws-amplify/graphql-api-construct'
import { IRole, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import * as path from 'path'
import { Code, FunctionRuntime } from 'aws-cdk-lib/aws-appsync'
import { UserPool } from 'aws-cdk-lib/aws-cognito'

type AmplifyGraphQLAPIProps = {
	appName: string
	account: string
	queueName: string
	identityPoolId: string
	authenticatedUserRole: IRole
	unauthenticatedUserRole: IRole
	userpool: UserPool
}

export const createAmplifyGraphQLAPI = (
	scope: Construct,
	props: AmplifyGraphQLAPIProps
) => {
	const api = new AmplifyGraphqlApi(scope, `${props.appName}`, {
		apiName: `${props.appName}`,
		definition: AmplifyGraphqlDefinition.fromFiles(
			path.join(__dirname, 'graphql/schema.graphql')
		),
		authorizationModes: {
			defaultAuthorizationMode: 'AMAZON_COGNITO_USER_POOLS',
			userPoolConfig: {
				userPool: props.userpool,
			},
			iamConfig: {
				identityPoolId: props.identityPoolId,
				authenticatedUserRole: props.authenticatedUserRole,
				unauthenticatedUserRole: props.unauthenticatedUserRole,
			},
		},
	})

	const sqsDataSource = api.addHttpDataSource(
		'sqsDataSource',
		'https://sqs.us-east-1.amazonaws.com',
		{
			authorizationConfig: {
				signingRegion: 'us-east-1',
				signingServiceName: 'sqs',
			},
		}
	)

	sqsDataSource.grantPrincipal.addToPrincipalPolicy(
		new PolicyStatement({
			actions: ['sqs:SendMessage'],
			resources: [`arn:aws:sqs:*:*:${props.queueName}`],
		})
	)

	const sendMessageToSQSFunc = api.addFunction('sendMessageToSQSFunc', {
		name: 'sendMessageToSQSFunc',
		dataSource: sqsDataSource,
		runtime: FunctionRuntime.JS_1_0_0,
		code: Code.fromAsset(
			path.join(__dirname, 'JS_Functions/sendMessageToSQS.js')
		),
	})

	const sendMessageResolver = api.addResolver('sendMessageResolver', {
		typeName: 'Mutation',
		fieldName: 'sendMessage',
		pipelineConfig: [sendMessageToSQSFunc],
		runtime: FunctionRuntime.JS_1_0_0,
		code: Code.fromInline(`
		export function request(ctx) {
			ctx.stash.account = "${props.account}"
			ctx.stash.queueName = "${props.queueName}"
			ctx.stash.appsyncUrl = "${api.graphqlUrl}"
			return {}
		}

		export function response(ctx) {
			return ctx.prev.result
		}
		`),
	})

	const publishMessageDataSource = api.addNoneDataSource(
		'publishMessageDataSource' //This is the name of the resolver in AppSync🤷‍♂️ 🧐
	)

	const publishMessageResolver = api.addResolver('publishMessageResolver', {
		dataSource: publishMessageDataSource,
		typeName: 'Mutation',
		fieldName: 'publish',
		code: Code.fromAsset(
			path.join(__dirname, 'JS_Functions/publishMessage.js')
		),
		runtime: FunctionRuntime.JS_1_0_0,
	})

	return api
}
