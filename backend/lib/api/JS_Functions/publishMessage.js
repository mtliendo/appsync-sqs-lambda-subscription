export function request(ctx) {
	return {
		payload: {
			message: ctx.arguments.body,
		},
	}
}

export function response(ctx) {
	return ctx.result.message
}
