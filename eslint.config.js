import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ["**/*.ts"],
        rules: {
            // your custom rules here
        }
    },
    {
        ignores: ["dist/**", "node_modules/**"],
    },
);