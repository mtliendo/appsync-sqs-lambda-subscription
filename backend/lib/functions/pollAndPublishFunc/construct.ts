import { Duration } from 'aws-cdk-lib'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'
import * as path from 'path'

type PollAndPublishFunctionProps = {
	region: string
	queue: Queue
}

export const createPollAndPublishFunction = (
	scope: Construct,
	props: PollAndPublishFunctionProps
) => {
	const pollAndPublishFunc = new NodejsFunction(scope, `pollAndPublishFunc`, {
		runtime: Runtime.NODEJS_18_X,
		handler: 'handler',
		entry: path.join(__dirname, `./main.ts`),
		environment: {
			REGION: props.region,
		},
		timeout: Duration.seconds(20),
		memorySize: 512,
	})

	pollAndPublishFunc.addEventSource(new SqsEventSource(props.queue))

	return pollAndPublishFunc
}
