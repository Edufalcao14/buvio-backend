import { Kind, OperationDefinitionNode } from 'graphql';

/**
 * True when an operation selects nothing but introspection meta-fields.
 *
 * The canonical introspection document is enormous and deeply nested by
 * design, so the depth and complexity ceilings reject it — which turns the
 * `introspection` flag into a switch that enables a feature nothing can use:
 * no GraphiQL, no client codegen. Whether introspection is allowed at all is
 * that flag's decision and it is made before these rules run; the ceilings
 * exist to bound resolver work, and introspection reaches no resolver.
 *
 * Every top-level selection has to be a meta-field: a document that mixes
 * `__schema` with real fields keeps its ceilings, so introspection cannot be
 * used as a carrier to smuggle an expensive query past them.
 */
export const isIntrospectionOperation = (
  operation: OperationDefinitionNode,
): boolean => {
  const selections = operation.selectionSet.selections;

  return (
    selections.length > 0 &&
    selections.every(
      (selection) =>
        selection.kind === Kind.FIELD && selection.name.value.startsWith('__'),
    )
  );
};
