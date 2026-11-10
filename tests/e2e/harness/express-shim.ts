/**
 * Express type shim for runtime execution.
 * Satisfies decorator metadata type references emitted by TypeScript.
 */

export class Request {}
export class Response {}
export class NextFunction {}

export default {
  Request,
  Response,
  NextFunction,
};
