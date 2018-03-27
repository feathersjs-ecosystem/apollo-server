// Expose types which can be used by both middleware flavors.
export { GraphQLOptions } from 'apollo-server-core';

// Express Middleware
export {
  ExpressGraphQLOptionsFunction,
  ExpressHandler,
  ExpressGraphiQLOptionsFunction,
  graphqlExpress,
  graphiqlExpress,
} from './feathersApollo';
