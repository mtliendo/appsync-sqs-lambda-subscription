import { Duration } from 'aws-cdk-lib'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'

export const createFifoMsgQueue = (scope: Construct) => {
	const fifoMsgQueue = new Queue(scope, 'fifoMsgQueue', {
		fifo: true,
		visibilityTimeout: Duration.seconds(30),
		contentBasedDeduplication: true,
	})

	return fifoMsgQueue
}
