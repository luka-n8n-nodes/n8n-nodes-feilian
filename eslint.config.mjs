import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{
		rules: {
			'@n8n/community-nodes/no-restricted-imports': 'off',
			'@n8n/community-nodes/no-restricted-globals': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'n8n-nodes-base/node-param-collection-type-unsorted-items': 'off',
			'prefer-const': 'warn',
		},
	},
];
