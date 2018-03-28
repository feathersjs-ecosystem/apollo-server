// Expose types which can be used by both middleware flavors.
export { GraphQLOptions } from 'apollo-server-core';

// Express Middleware
export {
  FeathersGraphiQLOptionsFunction,
  graphqlFeathers,
  graphiqlFeathers,
} from './feathersApollo';
