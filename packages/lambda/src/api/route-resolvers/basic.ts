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
  const { rawPath, requestContext } = event;
  const slugs = rawPath.split('/').filter((s) => s.length > 0);

  // Disallow any route that could be used to break the server
  if (slugs.some((item) => !isSafeKey(item))) return;

  slugs.push(requestContext.http.method.toLowerCase());

  const route = getRoute(routes, slugs);

  // // If the route is typed, resolve with path parameters
  // if (route && route.typed) {
  //   route.pathParams.
  // }
  return route;
}

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
  const _path: string[] = Array.isArray(path) ? path : path.split('.');

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
