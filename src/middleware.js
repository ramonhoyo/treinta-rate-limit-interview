class RateLimiterMiddleware {
  constructor(options) {
    this.rateLimitStore = new Map();
    this.options = options;
  }

  middleware() {
    return (req, res, next) => {
      const { ip } = req;
      const { maxRequests, timeWindow } = this.options;
      let clientData = this.rateLimitStore.get(ip);
      if (!clientData) {
        clientData = {
          firstRequest: Date.now(),
          requests: 1,
        };
        this.rateLimitStore.set(ip, clientData);
      }

      if (clientData.requests > maxRequests && Date.now() - clientData.firstRequest < timeWindow) {
        res.setHeader('X-RateLimit-Remaining', 0);
        res.status(429).send('You have exceeded the rate limit. Please try again later.');
        return;
      }

      clientData.requests += 1;
      const elapsedTime = Date.now() - clientData.firstRequest;
      if (elapsedTime > timeWindow) {
        clientData.firstRequest = Date.now();
        clientData.requests = 1;
      }
      this.rateLimitStore.set(ip, clientData);

      res.setHeader('X-RateLimit-Remaining', maxRequests - clientData.requests);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Reset', clientData.firstRequest + timeWindow - Date.now());

      next();
    };
  }

  reset() {
    this.rateLimitStore.clear();
  }
}

module.exports = RateLimiterMiddleware;
