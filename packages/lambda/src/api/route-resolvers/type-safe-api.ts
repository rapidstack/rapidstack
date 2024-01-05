import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import type {
  HttpRoute,
  HttpRouteFunction,
  TypedApiRouteConfig,
} from '../../handlers/index.js';
import type { HttpVerbs } from '../../index.js';

import { isSafeKey } from '../../index.js';

export type TypeSafeRouteResolverEventInfo = APIGatewayProxyEventV2 & {
  _interpretedPath?: string;
};

export type TypeSafeApiRouteInfo =
  | {
      adjacent?: HttpRoute;
      formattedParams: (string | undefined)[];
      matched: HttpRouteFunction;
      params: string[];
      path: string[];
    }
  | {
      adjacent?: HttpRoute;
      matched: undefined;
      path: string[];
    };

/**
 * Resolve a route from an API Gateway event
 * @param event The API Gateway event
 * @param routes The routes object to resolve from
 * @returns The route handler function, or undefined if no route was found
 */
export function resolveTypeSafeApiRoute(
  event: TypeSafeRouteResolverEventInfo,
  routes: TypedApiRouteConfig
): TypeSafeApiRouteInfo {
  const rawPath = event._interpretedPath ?? event.rawPath;
  const method =
    event.requestContext.http.method.toLowerCase() as Lowercase<HttpVerbs>;
  const pathSegments = rawPath.split('/').filter((s) => s.length > 0);

  if (pathSegments.some((segment) => !isSafeKey(segment)))
    return { matched: undefined, path: pathSegments };
  if (!pathSegments.length) {
    // eslint-disable-next-line security/detect-object-injection
    const matched = routes[method] as HttpRouteFunction | undefined;

    return {
      adjacent: getAdjacentVerbs(routes),
      formattedParams: [],
      matched,
      params: [],
      path: pathSegments,
    };
  }

  const params = [] as string[];

  while (pathSegments.length) {
    const localRoutes = getRoute(routes, [...pathSegments]);

    // eslint-disable-next-line security/detect-object-injection
    const possibleRoute = localRoutes?.[method];

    // If a route with typed path params is found, validate the number of params
    if (possibleRoute?.typed && possibleRoute.pathParams) {
      const { maxParams, minParams } = possibleRoute.pathParams;

      if (params.length > maxParams || params.length < minParams) {
        const removed = pathSegments.splice(pathSegments.length - 1, 1)[0];
        params.unshift(removed);
        continue;
      }

      // Hack to make valibot happy about a tuple not having all the params
      // i.e.: tuple([string(), optional(string()), optional(string())]) would
      // fail if only one param was passed. Will push undefined to the end of
      // the array to make it happy.
      for (let i = params.length; i < maxParams; i++) params.push(undefined!);

      // Hack to pass this info back to the validator function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event as Record<string, any>)['_interpretedPathParams'] = params;

      // if (typeof possibleRoute === 'function') {
      //   // remove the last element of the slugs array in a copy of the array
      //   const otherRoutes = pathSegments.slice(0, pathSegments.length - 1);
      //   const adjacentRoutes = getRoute(
      //     routes,
      //     otherRoutes
      //   ) as unknown as TypedApiRouteConfig;

      //   return {
      //     adjacent: getAdjacentVerbs(adjacentRoutes),
      //     candidate: possibleRoute,
      //     formattedParams: params,
      //     params: params.filter((p) => !!p),
      //     path: slugs,
      //   };
      // }

      return {
        adjacent: getAdjacentVerbs(localRoutes),
        formattedParams: params,
        matched: possibleRoute,
        params: params.filter((p) => !!p),
        path: pathSegments,
      };
    }
    // Handle standard route
    else if (possibleRoute && params.length === 0) {
      return {
        adjacent: getAdjacentVerbs(localRoutes),
        formattedParams: [],
        matched: possibleRoute,
        params: [],
        path: pathSegments,
      };
    } else if (localRoutes && !possibleRoute) {
      return {
        adjacent: getAdjacentVerbs(localRoutes),
        matched: undefined,
        path: pathSegments,
      };
    }

    const removed = pathSegments.splice(pathSegments.length - 1, 1)[0];
    params.unshift(removed);
  }

  return {
    matched: undefined,
    path: pathSegments,
  };
}

/**
 * Get the adjacent routes from a routes object
 * @param routes The routes object to get adjacent routes from
 * @returns The surrounding verbs for the specified route
 */
function getAdjacentVerbs(routes: HttpRoute | TypedApiRouteConfig | undefined) {
  if (!routes) return {};
  return Object.entries(routes).reduce((acc, [key, value]) => {
    if (typeof value !== 'function') return acc;
    acc[key as Lowercase<HttpVerbs>] = value;
    return acc;
  }, {} as HttpRoute);
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
): HttpRoute | undefined {
  const _path: string[] = Array.isArray(path) ? path : path.split('/');

  if (route && _path.length) {
    return getRoute(
      route[_path.shift() as string] as TypedApiRouteConfig,
      _path
    );
  }

  // TODO: this cast is not exactly accurate, but it's fine for now
  return route as HttpRoute | undefined;
}
