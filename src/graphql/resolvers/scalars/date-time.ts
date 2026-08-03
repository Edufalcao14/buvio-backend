import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';

// Function to check if a string is a valid ISO 8601 date format
const isValidISODateString = (value: string) => {
  const isoDatePattern =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?(Z|[+-]\d{2}:\d{2})$/;
  return isoDatePattern.test(value);
};

export const initDateTimeScalar = (): GraphQLScalarType => {
  return new GraphQLScalarType({
    name: 'DateTime',
    description:
      'A DateTime scalar type that handles values as ISO 8601 date strings',
    serialize(value) {
      // Ensure the value is a Date instance and convert to ISO string
      if (value instanceof Date) {
        return value.toISOString();
      }
      throw new GraphQLError(
        'DateTime Scalar serialize function expects a Date object',
      );
    },
    parseValue(value) {
      // Ensure the value is a valid ISO string and return a Date instance
      if (typeof value === 'string' && isValidISODateString(value)) {
        return new Date(value);
      }
      throw new GraphQLError(
        'DateTime Scalar parseValue function expects a valid ISO 8601 date string',
      );
    },
    parseLiteral(ast) {
      // Ensure the AST kind is STRING and the value is a valid ISO date string
      if (ast.kind === Kind.STRING && isValidISODateString(ast.value)) {
        return new Date(ast.value);
      }
      throw new GraphQLError(
        'DateTime Scalar parseLiteral function expects a valid ISO 8601 date string',
      );
    },
  });
};
