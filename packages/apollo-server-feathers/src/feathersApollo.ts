import { ExecutionResult, formatError, GraphQLError } from 'graphql';
import {
  resolveGraphqlOptions,
  GraphQLOptions,
  runQuery,
} from 'apollo-server-core';

import '@feathersjs/socket-commons';
import {
  FeathersError,
  MethodNotAllowed,
  BadRequest,
  GeneralError,
} from '@feathersjs/errors';
import { ServiceMethods, Params, Application } from '@feathersjs/feathers';
import { GraphQLResponse } from '../../apollo-server-core/dist/runQuery';

export interface FeathersGraphQLQuery {
  query: string;
  context?: any;
  operationName?: string;
  variables?: any;
}

export type FeathersGraphQLData =
  | FeathersGraphQLQuery
  | Array<FeathersGraphQLQuery>;

export interface FeathersGraphQLOptionsFunction {
  (service: FeathersGraphQLService): GraphQLOptions | Promise<GraphQLOptions>;
}

export interface FeathersGraphQLParams extends Params {
  query: FeathersGraphQLQuery;
}

export class FeathersGraphQLError extends FeathersError {
  constructor(message: string, data: any) {
    super(message, 'GraphQLError', 500, 'graphql-error', data);
  }
}

const setStatus = ctx => {
  ctx.statusCode = 200;
};

export class FeathersGraphQLService implements ServiceMethods<any> {
  options: GraphQLOptions | FeathersGraphQLOptionsFunction;

  constructor(options: GraphQLOptions | FeathersGraphQLOptionsFunction) {
    this.options = options;
  }

  async query(
    q: FeathersGraphQLQuery | Array<FeathersGraphQLQuery>,
  ): Promise<ExecutionResult | Array<ExecutionResult>> {
    const optionsObject = await resolveGraphqlOptions(this.options, this);
    const isBatch = Array.isArray(q);
    const queries = Array.isArray(q) ? q : [q];
    const requests = queries.map(current => {
      let { query, variables, operationName } = current;
      let context = optionsObject.context || {};

      if (typeof context === 'function') {
        context = context();
      } else if (isBatch) {
        context = Object.assign(
          Object.create(Object.getPrototypeOf(context)),
          context,
        );
      }

      try {
        variables =
          typeof variables === 'string' ? JSON.parse(variables) : variables;
      } catch (error) {
        throw new BadRequest('Variables are invalid JSON.');
      }

      let params = Object.assign({ formatError }, optionsObject, {
        query,
        variables,
        context,
        operationName,
      });

      if (optionsObject.formatParams) {
        params = optionsObject.formatParams(params);
      }

      return runQuery(params).catch(error => {
        return { errors: [params.formatError(error)] } as GraphQLResponse;
      });
    });
    const results = await Promise.all(requests);

    return isBatch ? results : results[0];
  }

  async find(params?: FeathersGraphQLParams): Promise<any> {
    if (!params.query || !params.query.query) {
      throw new BadRequest('GET query missing.');
    }

    return this.query(params.query);
  }

  async create(data: FeathersGraphQLData, params?: Params): Promise<any> {
    return this.query(data);
  }

  async get(id: any, params?: Params): Promise<any> {
    throw new MethodNotAllowed('Method get is not implemented');
  }

  async update(id: any, data: any, params?: Params): Promise<any> {
    throw new MethodNotAllowed('Method update is not implemented');
  }

  async patch(id: any, data: Partial<any>, params?: Params): Promise<any> {
    throw new MethodNotAllowed('Method patch is not implemented');
  }

  async remove(id: any, params?: Params): Promise<any> {
    throw new MethodNotAllowed('Method remove is not implemented');
  }

  setup(app: Application, path: string): void {
    const service = app.service(path);

    if (typeof service.publish === 'function') {
      service.publish(() => null);
    }

    service.hooks({
      after: {
        find: setStatus,
        create: setStatus,
      },
      error: {
        create(context) {
          if (!context.data) {
            context.error = new GraphQLError('POST body missing.');
          }
        },
      },
    });

    // Workaround because the TypeScript definition for services
    // currently does not allow optional methods
    delete service.update;
    delete service.remove;
    delete service.patch;
    delete service.get;
  }
}

export function graphqlFeathers(
  options: GraphQLOptions | FeathersGraphQLOptionsFunction,
): FeathersGraphQLService {
  if (!options) {
    throw new Error('Apollo Server requires options.');
  }

  if (arguments.length > 1) {
    throw new Error(
      `Apollo Server expects exactly one argument, got ${arguments.length}`,
    );
  }

  return new FeathersGraphQLService(options);
}

export {
  graphiqlExpress as graphiqlFeathers,
  ExpressGraphiQLOptionsFunction as FeathersGraphiQLOptionsFunction,
} from 'apollo-server-express';
