import { Elysia, t } from 'elysia'
import { Context } from '../context'
import { Try } from '@/lib'

export const AuthController = new Elysia({
	prefix: '/auth',
})
	.use(Context)
	.model({
		'auth.signin': t.Object({
			email: t.String({
				format: 'email',
			}),
			password: t.String(),
		}),
		'auth.signup': t.Object({
			email: t.String({
				format: 'email',
				default: '',
				error() {
					return 'Invalid email'
				},
			}),
			name: t.String({
				minLength: 4,
				maxLength: 32,
				error() {
					return 'Name min length: 4 and max length: 32'
				},
			}),
			password: t.String({
				minLength: 6,
				error() {
					return 'Weak password'
				},
			}),
		}),
	})
	.post(
		'/signup',
		async (ctx) => {
			ctx.log.info("Hello")
			const error = (e: Error) => {
				ctx.set.status = 'Bad Request'
				return {
					error: e.message,
				}
			}

			const input = {
				email: ctx.body.email,
				name: ctx.body.name,
				password: ctx.body.password,
			}

			const user = await Try(() =>
				ctx.auth.createUser({
					key: {
						providerId: 'email',
						providerUserId: input.email,
						password: input.password,
					},
					attributes: {
						name: input.name,
						picture: null,
						email: input.email,
					},
				}),
			)()

			if (user.err) {
				return error(user.val)
			}

			const session = await Try(() =>
				ctx.auth.createSession({
					userId: user.val.userId,
					attributes: {},
				}),
			)()
			if (session.err) {
				return error(session.val)
			}

			const sessionCookie = ctx.auth.createSessionCookie(session.val)

			ctx.set.headers['Set-Cookie'] = sessionCookie.serialize()
			ctx.set.headers['Location'] = '/new-user'
			ctx.set.status = 'Created'

			return null
		},
		{
			type: 'formdata',
			body: 'auth.signup',
		},
	)
	.get('/signout', async (ctx) => {
		const authRequest = ctx.auth.handleRequest(ctx)
		const session = await authRequest.validate()

		if (!session) {
			ctx.redirect('/')
			return
		}

		await ctx.auth.invalidateSession(session.sessionId)

		const sessionCookie = ctx.auth.createSessionCookie(null)

		ctx.set.headers['Set-Cookie'] = sessionCookie.serialize()
		ctx.redirect('/')
	})
