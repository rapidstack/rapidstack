import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import type {
  ApiHandlerReturn,
  TypedApiRouteConfig,
} from '../../handlers/type-safe-api/types.js';
import type { BaseApiRouteProps } from '../../handlers/type-safe-api/validator.js';

export {};
// https://gist.github.com/harish2704/d0ee530e6ee75bad6fd30c98e5ad9dab?permalink_comment_id=3973327#gistcomment-3973327

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
  // const { rawPath } = event;
  const route = routes['get'] as (
    params: BaseApiRouteProps
  ) => Promise<ApiHandlerReturn>;
  return route;
}
