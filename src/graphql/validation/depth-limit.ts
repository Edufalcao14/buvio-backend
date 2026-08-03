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
 * Rejects queries nested deeper than `maxDepth`.
 *
 * The schema is cyclic (User.team -> Team.creator -> User.team ...), so without
 * a depth ceiling a single small request expands into thousands of resolver
 * calls and database round trips.
 */
export const depthLimitRule =
  (maxDepth: number) =>
  (context: ValidationContext): ASTVisitor => {
    const fragments = new Map<string, FragmentDefinitionNode>();

    for (const definition of context.getDocument().definitions) {
      if (definition.kind === Kind.FRAGMENT_DEFINITION) {
        fragments.set(definition.name.value, definition);
      }
    }

    const depthOf = (
      selectionSet: SelectionSetNode,
      visitedFragments: ReadonlySet<string>,
    ): number => {
      let deepest = 0;

      for (const selection of selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
          const childDepth = selection.selectionSet
            ? depthOf(selection.selectionSet, visitedFragments)
            : 0;
          deepest = Math.max(deepest, 1 + childDepth);
          continue;
        }

        if (selection.kind === Kind.INLINE_FRAGMENT) {
          deepest = Math.max(
            deepest,
            depthOf(selection.selectionSet, visitedFragments),
          );
          continue;
        }

        // Fragment spread. Guard against cycles, which are legal to write even
        // though execution would reject them.
        const name = selection.name.value;
        const fragment = fragments.get(name);
        if (!fragment || visitedFragments.has(name)) {
          continue;
        }
        deepest = Math.max(
          deepest,
          depthOf(fragment.selectionSet, new Set([...visitedFragments, name])),
        );
      }

      return deepest;
    };

    return {
      OperationDefinition(operation) {
        if (isIntrospectionOperation(operation)) {
          return;
        }

        const depth = depthOf(operation.selectionSet, new Set());

        if (depth > maxDepth) {
          context.reportError(
            new GraphQLError(
              `Query is nested ${depth} levels deep, the maximum is ${maxDepth}.`,
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
