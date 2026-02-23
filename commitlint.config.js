module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'body-max-line-length': [1, 'always', 100],
        'body-max-length': [2, 'always', 1000],
        // Lower sensitivity rules
        'subject-case': [0], // allow uppercase, sentence case, etc.
        'type-enum': [1, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']], // warn instead of error for unknown types
        'type-empty': [1, 'never'], // warn instead of error when type is missing
        'subject-empty': [1, 'never'], // warn instead of error when subject is missing
        'header-max-length': [1, 'always', 100], // warn if header is too long
    },
};
