## Ideal Flow

1. event comes in from client

2. a timer is started for handler begin

3. determine if valid event, a shutdown needs registering + registering

4. process hot function hook (would not have valid api event)

5. lookup candidate route

   - returns the candidate route, if it was "typed" or not, the adjacent verbs, the interpreted path, matched params as arrays, and formatted params for validator (with necessary `undefined` tuple indices)
   - if anything fails in here for any reason, throw a 500 error with message "Something went wrong trying to route your request" (?)

6. run pre handler:

   - can append cookies or headers to the responseContext for processing responses iff hook doesn't return response
   - gets event, context, logger, cache, route lookup object, and responseContext
   - maybe an responseFormatter util function?
   - can interrupt further execution by returning a function. Must conform APIGatewayProxyResultV2
   - can throw an error, where the error will then be caught in the onError hook for processing if it exists. See below

7. if not return early, start a timer for handler begin

8. run the candidate route. Responses are expected to have a body, headers, and cookie object.

   - note: cookies and headers _could_ have been omitted from this portion and just relied on the responseContext values, but then some requirements like 302 requiring a location header would not be caught.
   - gets event, context, logger, cache, route lookup object, and responseContext

9. run the post handler:

   - gets event, context, logger, cache, route lookup object, result, and responseContext

10. process steps 4-9 in a try-catch, where anything caught gets processed by the onError handler:

    - gets event, context, logger, cache, route lookup object, responseContext, and error
