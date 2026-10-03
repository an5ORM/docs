/**
 * Prism grammar for the .an5 schema language.
 *
 * Load after prism.min.js. A schema file is a set of `model` blocks: a name, a
 * brace-delimited list of fields, and optional block attributes.
 *
 *   model User {
 *     id    NVARCHAR(1000) @id @default(uuid())
 *     email NVARCHAR(255)? @unique // trailing comment
 *     posts Post[]
 *
 *     @@map("users")
 *   }
 *
 * A field is a name followed by a type, and the type is what gives the field
 * away: a model name (`User`), a SQL type (`NVARCHAR`), or a list of either
 * (`Post[]`). So the field is matched as one unit and split inside, otherwise
 * the name and the type are indistinguishable and whichever the tokeniser
 * reaches first wins.
 */
(function (Prism) {
  var SQL_TYPES = [
    'TIME WITH TIME ZONE', 'TIME WITHOUT TIME ZONE',
    'TIMESTAMP WITH TIME ZONE', 'TIMESTAMP WITHOUT TIME ZONE',
    'CHARACTER VARYING', 'VARYING CHARACTER',
    'DOUBLE PRECISION', 'UNSIGNED BIG INT',
    'NVARCHAR', 'VARCHAR', 'NCHAR', 'CHAR', 'TEXT', 'NTEXT',
    'INT', 'INTEGER', 'INT2', 'INT4', 'INT8', 'BIGINT', 'SMALLINT', 'TINYINT', 'MEDIUMINT',
    'SERIAL', 'BIGSERIAL', 'SMALLSERIAL',
    'FLOAT', 'REAL', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'MONEY', 'SMALLMONEY', 'FIXED',
    'BIT', 'BOOLEAN', 'BOOL',
    'DATETIME2', 'DATETIME', 'DATE', 'TIME', 'TIMETZ', 'TIMESTAMP', 'TIMESTAMPTZ',
    'DATETIMEOFFSET', 'SMALLDATETIME', 'INTERVAL', 'YEAR',
    'UNIQUEIDENTIFIER', 'UUID',
    'VARBINARY', 'BINARY', 'IMAGE', 'ROWVERSION', 'BYTEA', 'BYTES', 'BLOB',
    'TINYBLOB', 'MEDIUMBLOB', 'LONGBLOB', 'CLOB',
    'JSON', 'JSONB', 'XML',
    'STRING', 'SYSNAME', 'SQL_VARIANT', 'SQLVARIANT', 'HIERARCHYID',
    'GEOGRAPHY', 'GEOMETRY', 'POINT', 'LINESTRING', 'POLYGON', 'VECTOR',
    'INET', 'CIDR', 'ENUM', 'SET',
  ].join('|');

  // The type, with its precision or length arguments attached. `[]` marks a
  // list of models, e.g. `orders Order[]`.
  var typedName = '[A-Za-z_]\\w*(?:\\s*\\(\\s*\\d+(?:\\s*,\\s*\\d+)?\\s*\\))?(?:\\[\\])?';

  Prism.languages.an5 = {
    comment: {
      pattern: /\/\/.*|\/\*[\s\S]*?\*\//,
      greedy: true,
    },
    string: {
      pattern: /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'/,
      greedy: true,
    },

    // Block attributes come first so the second `@` of `@@map` is not left to
    // be read as a stray field attribute.
    'block-attr': {
      pattern: /@@[a-zA-Z_]\w*/,
      alias: 'decorator',
    },

    // Ahead of `keyword` on purpose: a field can be named `model` or
    // `provider`, and the keyword pattern would claim the name first and
    // leave the type unstyled for the rest of the line.
    // `name  Type`, optionally `?`, ending at an attribute, a comment or the
    // end of the line. Attributes and comments stay outside the match.
    field: {
      pattern: new RegExp(
        '^[ \\t]*[A-Za-z_]\\w*[ \\t]+' + typedName + '[ \\t]*\\??' +
        '(?=[ \\t]*(?:@|//|/\\*|\\r?$))',
        'm',
      ),
      inside: {
        // Prism only adds the `g` flag to a pattern when it is `greedy`, and
        // without it `exec` restarts from 0 on every call. Every pattern here
        // needs `greedy` for lastIndex to be honoured, not for the sake of
        // matching across tokens.
        'field-name': {
          pattern: /^([ \t]*)[A-Za-z_]\w*/,
          lookbehind: true,
          greedy: true,
          alias: 'property',
        },
        builtin: {
          pattern: new RegExp('\\b(?:' + SQL_TYPES + ')\\b' +
            '(?:\\s*\\(\\s*\\d+(?:\\s*,\\s*\\d+)?\\s*\\))?', 'i'),
          greedy: true,
          alias: 'class-name',
        },
        // The remaining type once the SQL types are claimed: a model name,
        // possibly a list. The field name is already a token by this point, so
        // the next identifier is the type.
        'type-ref': {
          pattern: /[A-Za-z_]\w*(?:\[\])?/,
          greedy: true,
          alias: 'class-name',
        },
        number: { pattern: /\b\d+\b/, greedy: true },
        punctuation: { pattern: /[()\[\]?]/, greedy: true },
      },
    },

    keyword: /\b(?:model|enum|datasource|generator|previewFeatures|provider|output|import)\b/,

    'block-name': {
      pattern: /(\b(?:model|enum|datasource|generator)\s+)[A-Za-z_]\w*/,
      lookbehind: true,
      alias: 'class-name',
    },

    'field-attr': {
      pattern: /@[a-zA-Z_]\w*/,
      alias: 'decorator',
    },

    'default-fn': {
      pattern: /\b(?:uuid|now|autoincrement|newid|newsequentialid|guid)\b(?=\s*\()/i,
      alias: 'function',
    },

    number: /\b\d+(?:\.\d+)?\b/,
    boolean: /\b(?:true|false)\b/,
    punctuation: /[{}[\]().,;:]/,
  };
})(typeof Prism !== 'undefined' ? Prism : undefined);

// Prism highlights on DOMContentLoaded on its own. This covers the case where
// this file is parsed after the document is already interactive, and keeps the
// grammar loadable outside a browser (the test harness).
if (typeof Prism !== 'undefined' && typeof document !== 'undefined') {
  Prism.highlightAll();
}
