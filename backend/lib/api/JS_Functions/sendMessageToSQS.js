export function request(ctx) {
	console.log('the context', ctx)
	console.log('the stash', ctx.stash)
	console.log('the stash appsyncurl', ctx.stash.appsyncUrl)
	return {
		resourcePath: `/${ctx.stash.account}/${ctx.stash.queueName}`,
		method: 'POST',
		params: {
			headers: {
				'X-Amz-Target': 'AmazonSQS.SendMessage',
				'Content-Type': 'application/x-amz-json-1.0',
			},
			body: {
				MessageBody: JSON.stringify({
					message: ctx.arguments.msg,
					appsyncUrl: ctx.stash.appsyncUrl,
				}),
				MessageGroupId: 'appsync-sqs',
			},
		},
	}
}

export function response(ctx) {
	const body = JSON.parse(ctx.result.body)
	return body.MessageId
}
