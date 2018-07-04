import feathers from '@feathersjs/feathers';
import {
  default as express,
  json,
  rest,
  errorHandler,
} from '@feathersjs/express';
import { graphqlFeathers, graphiqlFeathers } from './feathersApollo';
import testSuite, {
  schema as Schema,
  CreateAppOptions,
} from 'apollo-server-integration-testsuite';
import { expect } from 'chai';
import { GraphQLOptions } from 'apollo-server-core';
import 'mocha';

function createApp(options: CreateAppOptions = {}) {
  const app = express(feathers());

  options.graphqlOptions = options.graphqlOptions || { schema: Schema };

  if (!options.excludeParser) {
    app.use(json());
  }

  app.configure(rest());

  if (options.graphiqlOptions) {
    app.use('/graphiql', graphiqlFeathers(options.graphiqlOptions));
  }

  app.use('/graphql', graphqlFeathers(options.graphqlOptions));

  app.use(errorHandler());
  app.setup();

  return app;
}

describe('feathersApollo', () => {
  it('throws error if called without schema', function() {
    expect(() => graphqlFeathers(undefined as GraphQLOptions)).to.throw(
      'Apollo Server requires options.',
    );
  });

  it('throws an error if called with more than one argument', function() {
    expect(() => (<any>graphqlFeathers)({}, 'x')).to.throw(
      'Apollo Server expects exactly one argument, got 2',
    );
  });
});

describe.only('integration:Feathers', () => {
  testSuite(createApp);
});
