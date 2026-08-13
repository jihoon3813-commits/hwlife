/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as channels from "../channels.js";
import type * as checkIp from "../checkIp.js";
import type * as check_stats from "../check_stats.js";
import type * as check_types from "../check_types.js";
import type * as competitors from "../competitors.js";
import type * as crawler from "../crawler.js";
import type * as fix_plans from "../fix_plans.js";
import type * as images from "../images.js";
import type * as inquiries from "../inquiries.js";
import type * as landings from "../landings.js";
import type * as plans from "../plans.js";
import type * as products from "../products.js";
import type * as settings from "../settings.js";
import type * as shorts from "../shorts.js";
import type * as sms from "../sms.js";
import type * as stats from "../stats.js";
import type * as test from "../test.js";
import type * as test_data from "../test_data.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  channels: typeof channels;
  checkIp: typeof checkIp;
  check_stats: typeof check_stats;
  check_types: typeof check_types;
  competitors: typeof competitors;
  crawler: typeof crawler;
  fix_plans: typeof fix_plans;
  images: typeof images;
  inquiries: typeof inquiries;
  landings: typeof landings;
  plans: typeof plans;
  products: typeof products;
  settings: typeof settings;
  shorts: typeof shorts;
  sms: typeof sms;
  stats: typeof stats;
  test: typeof test;
  test_data: typeof test_data;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
