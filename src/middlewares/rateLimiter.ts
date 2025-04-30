import rateLimit from "express-rate-limit"

export const limiter = rateLimit({
	// Rate limiter configuration
	windowMs: 1 * 60 * 1000, // 1 minutes
	max: 15, // Limit each IP to 15 requests per `window` (here, per 1 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers

	// Redis store configuration
	// store: new RedisStore({
	// 	sendCommand: (...args: string[]) => client.sendCommand(args),
	// }),
})