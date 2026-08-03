import {
  ASTVisitor,
  FragmentDefinitionNode,
  GraphQLError,
  Kind,
  SelectionSetNode,
  ValidationContext,
} from 'graphql';
import { isIntrospectionOperation } from './introspection';

/**
 * Rejects documents that select more fields than `maxFields` in total.
 *
 * Depth alone does not bound cost: a shallow query can still fan out by
 * repeating the same field under many aliases. Counting selections catches
 * that shape, and both rules together bound how much work one request can ask
 * for before any resolver runs.
 */
export const complexityLimitRule =
  (maxFields: number) =>
  (context: ValidationContext): ASTVisitor => {
    const fragments = new Map<string, FragmentDefinitionNode>();

    for (const definition of context.getDocument().definitions) {
      if (definition.kind === Kind.FRAGMENT_DEFINITION) {
        fragments.set(definition.name.value, definition);
      }
    }

    const countFields = (
      selectionSet: SelectionSetNode,
      visitedFragments: ReadonlySet<string>,
    ): number => {
      let total = 0;

      for (const selection of selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
          total += 1;
          if (selection.selectionSet) {
            total += countFields(selection.selectionSet, visitedFragments);
          }
          continue;
        }

        if (selection.kind === Kind.INLINE_FRAGMENT) {
          total += countFields(selection.selectionSet, visitedFragments);
          continue;
        }

        const name = selection.name.value;
        const fragment = fragments.get(name);
        if (!fragment || visitedFragments.has(name)) {
          continue;
        }
        total += countFields(
          fragment.selectionSet,
          new Set([...visitedFragments, name]),
        );
      }

      return total;
    };

    return {
      OperationDefinition(operation) {
        if (isIntrospectionOperation(operation)) {
          return;
        }

        const fieldCount = countFields(operation.selectionSet, new Set());

        if (fieldCount > maxFields) {
          context.reportError(
            new GraphQLError(
              `Query selects ${fieldCount} fields, the maximum is ${maxFields}.`,
              {
                nodes: [operation],
                // Apollo overwrites `code` on validation errors, so the marker
                // the formatter keys off lives under its own key.
                extensions: { buvioErrorCode: 'QUERY_TOO_COMPLEX' },
              },
            ),
          );
        }
      },
    };
  };
