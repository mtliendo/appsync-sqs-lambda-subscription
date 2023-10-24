import { createFifoMsgQueue } from './queues/fifoMsgQueue'
import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { createAmplifyGraphQLAPI } from './api/appsync'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { createPollAndPublishFunction } from './functions/pollAndPublishFunc/construct'
import { createCognitoAuth } from './auth/cognito'

export class BackendStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props)
		const appName = 'appSync-queue-publisher'

		//* Instantiate the services
		const auth = createCognitoAuth(this, { appName })

		const fifoMsgQueue = createFifoMsgQueue(this)

		const pollAndPublishFunc = createPollAndPublishFunction(this, {
			queue: fifoMsgQueue,
			region: this.region,
		})

		const asyncAppSyncAPI = createAmplifyGraphQLAPI(this, {
			appName,
			queueName: fifoMsgQueue.queueName,
			account: this.account,
			authenticatedUserRole: auth.identityPool.authenticatedRole,
			unauthenticatedUserRole: auth.identityPool.unauthenticatedRole,
			identityPoolId: auth.identityPool.identityPoolId,
			userpool: auth.userPool,
		})

		//* Configure policies
		const appsyncArn = asyncAppSyncAPI.resources.graphqlApi.arn

		pollAndPublishFunc.addToRolePolicy(
			new PolicyStatement({
				actions: ['appsync:GraphQL'],
				resources: [`${appsyncArn}/types/Mutation/fields/publish`],
			})
		)
	}
}
