import eslint from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: ['./tsconfig.node.json', './tsconfig.app.json', './tsconfig.e2e.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  {
    ignores: [
      'node_modules',
      'dist',
      'dev-dist',
      'build',
      'coverage',
      'public',
      'scripts',
      'archive',
      'playwright-report',
      'test-results',
    ],
  },
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      '@tanstack/query': pluginQuery,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // 'no-console': 'warn', // eslint rule
      'react/jsx-no-useless-fragment': 'error', // React rule
      'react-hooks/exhaustive-deps': 'off', // hooks rule
      '@typescript-eslint/no-unused-vars': 'off', // typescript rule
      '@typescript-eslint/no-shadow': 'error', // typescript rule
      // '@typescript-eslint/explicit-module-boundary-types': 'error', // Oblige à typer les exports
      '@typescript-eslint/no-explicit-any': 'error', // Interdit `any`
      // '@typescript-eslint/explicit-function-return-type': 'error', // Oblige à typer les retours de fonction
      '@typescript-eslint/strict-boolean-expressions': 'error', // Force un typage strict des booléens
      // "@typescript-eslint/no-untyped-public-signature": "error" // Empêche les signatures publiques sans type
      // 'no-unused-vars': 'warn',
      '@typescript-eslint/unbound-method': 'off', //évite les faux positifs sur les méthodes de classes
      '@tanstack/query/exhaustive-deps': 'error', // Règle pour les dépendances de React Query
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        'NewExpression[callee.name="Error"]',
        'ClassDeclaration[superClass.name="Error"]',
        'ClassExpression[superClass.name="Error"]',
      ],
    },
  },
  {
    // Whitelists de docs/DECISIONS.md (D-002) — chaque ligne est un verdict de l'audit,
    // pas une exception de confort. Retirer une ligne sans retirer le verdict associé.
    rules: { 'no-restricted-syntax': 'off' },
    files: [
      'src/utils/BaseError.ts', // la racine de la hiérarchie : elle a le droit d'étendre Error
      'src/data/models/converters/**', // idiome library : throw sur entrée invalide
      'src/utils/manifest.ts', // helpers purs i18n, même verdict que les converters
      'src/components/reducers/**', // « hook used outside provider »
      'src/components/ui/form.tsx',
      'src/components/ui/sidebar.tsx',
      'src/hooks/useExperimental.tsx',
      'src/utils/images.ts', // incidents DOM/canvas non récupérables (contexte 2d, toBlob, onload)
      'src/hooks/data/collections/useCollectionImporter.tsx', // throw-to-boundary : seule `.message` est lue
      'src/hooks/data/convertedFiles/useRepository.tsx', // idem (+2 préconditions de configuration)
      'src/hooks/data/sources/useThumbnail.tsx', // idem (error_no_thumbnail)
      'src/hooks/usePdfConverter.ts', // idem (error_no_file_selected)
      'src/utils/__tests__/utils.test.ts', // épingle getErrorMessage : fabrique un Error nu volontairement
    ],
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
