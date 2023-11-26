import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import type {
  ApiHandlerReturn,
  TypedApiRouteConfig,
} from '../../handlers/type-safe-api/types.js';
import type { BaseApiRouteProps } from '../../handlers/type-safe-api/validator.js';
import { isSafeKey } from '../../index.js';

/**
 *
 * @param event The API Gateway event
 * @param routes The routes object to resolve from
 * @returns The route handler function, or undefined if no route was found
 */
export function resolveRoute(
  event: APIGatewayProxyEventV2,
  routes: TypedApiRouteConfig
): ((params: BaseApiRouteProps) => Promise<ApiHandlerReturn>) | undefined {
  const { rawPath, requestContext } = event;
  const slugs = rawPath.split('/').filter((s) => s.length > 0);

  // Disallow any route that could be used to break the server
  if (slugs.some((item) => !isSafeKey(item))) return;

  slugs.push(requestContext.http.method.toLowerCase());

  const route = getRoute(routes, slugs);
  return route;
}

/**
 *
 * @param route
 * @param path
 * @returns
 * @author [source]('https://gist.github.com/harish2704/
 * d0ee530e6ee75bad6fd30c98e5ad9dab?permalink_comment_id=3973327#gistcomment-3973327')
 */
function getRoute(
  route: TypedApiRouteConfig,
  path: string | string[]
): ((params: BaseApiRouteProps) => Promise<ApiHandlerReturn>) | undefined {
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
