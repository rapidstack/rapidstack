import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import type {
  ApiHandlerReturn,
  HttpRouteFunction,
  TypedApiRouteConfig,
} from '../../handlers/index.js';
import type { BaseApiRouteProps } from '../../index.js';

import { isSafeKey } from '../../index.js';

/**
 * Resolve a route from an API Gateway event
 * @param event The API Gateway event
 * @param routes The routes object to resolve from
 * @returns The route handler function, or undefined if no route was found
 */
export function resolveRoute(
  event: APIGatewayProxyEventV2,
  routes: TypedApiRouteConfig
): HttpRouteFunction | undefined {
  const rawPath = event.rawPath;
  const method = event.requestContext.http.method.toLowerCase();
  const slugs = rawPath.split('/').filter((s) => s.length > 0);

  if (slugs.some((item) => !isSafeKey(item))) return;
  if (!slugs.length) {
    // eslint-disable-next-line security/detect-object-injection
    return routes[method] as HttpRouteFunction | undefined;
  }

  const params = [] as string[];
  slugs.push(method);

  while (slugs.length) {
    const possibleRoute = getRoute(routes, [...slugs]);

    // If a route with typed path params is found, validate the number of params
    if (possibleRoute?.typed && possibleRoute.pathParams) {
      const { maxParams, minParams } = possibleRoute.pathParams;

      if (params.length > maxParams || params.length < minParams) {
        const removed = slugs.splice(slugs.length - 2, 1)[0];
        params.unshift(removed);
        continue;
      }

      // Hack to make valibot happy about a tuple not having all the params
      // i.e.: tuple([string(), optional(string()), optional(string())]) would
      // fail if only one param was passed. Will push undefined to the end of
      // the array to make it happy.
      for (let i = params.length; i < maxParams; i++) {
        params.push(undefined!);
      }

      // Hack to pass this info back to the validator function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event as Record<string, any>)['_interpretedPathParams'] = params;
      return possibleRoute;
    }
    // Handle standard route
    else if (possibleRoute && params.length === 0) {
      return possibleRoute;
    }

    const removed = slugs.splice(slugs.length - 2, 1)[0];
    params.unshift(removed);
  }
}

/* 

// Disallow any route that could be used to break the server
  if (slugs.some((item) => !isSafeKey(item))) return;

  slugs.push(requestContext.http.method.toLowerCase());

  const route = getRoute(routes, slugs);

  // If the route is typed, resolve with path parameters
  if (route && route.typed) {
    console.log('we here!', route.pathParams);
  }

  return route;
*/

/**
 * Recursively resolve a route from a path
 * @param route The route object to resolve from
 * @param path The path to resolve
 * @returns The route handler function, or undefined if no route was found
 * @author [source]('https://gist.github.com/harish2704/
 * d0ee530e6ee75bad6fd30c98e5ad9dab?permalink_comment_id=3973327#gistcomment-3973327')
 */
function getRoute(
  route: TypedApiRouteConfig | undefined,
  path: string | string[]
): HttpRouteFunction | undefined {
  const _path: string[] = Array.isArray(path) ? path : path.split('/');

  if (route && _path.length) {
    return getRoute(
      route[_path.shift() as string] as TypedApiRouteConfig,
      _path
    );
  }

  // TODO: this cast is not exactly accurate, but it's fine for now
  return route as unknown as (
    params: BaseApiRouteProps
  ) => Promise<ApiHandlerReturn>;
}
