import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';

const isValidEmail = (value: string) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value);
};

export const initEmailScalar = (): GraphQLScalarType => {
  return new GraphQLScalarType({
    name: 'Email',
    description: 'Email custom scalar type',
    serialize(value) {
      if (typeof value === 'string' && isValidEmail(value)) {
        return value;
      }
      throw new GraphQLError(
        'Email Scalar serialize expects a valid email string',
      );
    },
    parseValue(value) {
      if (typeof value === 'string' && isValidEmail(value)) {
        return value;
      }
      throw new GraphQLError(
        'Email Scalar parseValue expects a valid email string',
      );
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING && isValidEmail(ast.value)) {
        return ast.value;
      }
      throw new GraphQLError(
        'Email Scalar parseLiteral expects a valid email string',
      );
    },
  });
};
