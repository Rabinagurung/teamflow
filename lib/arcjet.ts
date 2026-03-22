import arcjet, {
  detectBot,
  fixedWindow,
  protectSignup,
  sensitiveInfo,
  shield,
  slidingWindow,
} from "@arcjet/next"

// Re-export the rules to simplify imports inside handlers
export {
  detectBot,
  fixedWindow,
  protectSignup,
  sensitiveInfo,
  shield,
  slidingWindow,
}

// Create a base Arcjet instance for use by each handler
export default arcjet({
  // Get your site key from https://app.arcjet.com
  // and set it as an environment variable rather than hard coding.
  // See: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
  key:
    process.env.ARCJET_KEY ??
    (() => {
      throw new Error("ARCJET_KEY environment variable is required but not set")
    })(),

  //https://docs.arcjet.com/fingerprints
  /**By default, the fingerprint is generated based on the client IP address.
   *This can be configured by specifying different characteristics like "userId".
   *"userId" : always remains same so used to create custom fingerprint.
   * */
  characteristics: ["userId"],
  rules: [
    // You can include one or more rules base rules and it will be included in every request
    // But the rules can be set per page level to keep it dynamic.
  ],
})
