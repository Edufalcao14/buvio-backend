import { Kind, OperationDefinitionNode, parse } from 'graphql';
import { isIntrospectionOperation } from './introspection';

const operationOf = (document: string): OperationDefinitionNode => {
  const definition = parse(document).definitions[0];

  if (definition.kind !== Kind.OPERATION_DEFINITION) {
    throw new Error('expected an operation');
  }

  return definition;
};

describe('isIntrospectionOperation', () => {
  it('recognises a pure introspection document', () => {
    expect(
      isIntrospectionOperation(
        operationOf(
          '{ __schema { types { name } } __type(name: "Me") { name } }',
        ),
      ),
    ).toBe(true);
  });

  it('rejects a regular query', () => {
    expect(isIntrospectionOperation(operationOf('{ me { id } }'))).toBe(false);
  });

  it('rejects introspection mixed with real fields, so it cannot carry one', () => {
    expect(
      isIntrospectionOperation(
        operationOf('{ __schema { types { name } } me { id } }'),
      ),
    ).toBe(false);
  });
});
