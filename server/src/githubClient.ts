import { Octokit } from '@octokit/rest';

let octokit: Octokit;

export function initGitHub() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) throw new Error('NO GITHUB_TOKEN en .env');

  octokit = new Octokit({ auth: token });

  octokit.rest.users.getAuthenticated()
    .then(user => {
      console.log('✅ GitHub Connected as:', user.data.login);
    })
    .catch(err => {
      console.error('❌ Error at connecting to GitHub:', err.message);
    });
}

export { octokit };
