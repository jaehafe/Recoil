import React, { useState } from 'react';
import { selector, selectorFamily, useRecoilValue, noWait } from 'recoil';

const rand = selector({
  key: 'rand',
  get: () =>
    new Promise((resolve) => setTimeout(() => resolve(Math.random()), 5000)),
});

const projectStar = selectorFamily({
  key: 'project/star',
  get:
    (projectPath) =>
    async ({ get }) => {
      if (!projectPath) return '...';

      const randomNumLoadable = get(noWait(rand));
      const response = await fetch(
        `https://api.github.com/repos/${projectPath}`
      );
      const projectInfo = await response.json();

      if (randomNumLoadable.state === 'hasValue') {
        return projectInfo.stargazers_count + ' ' + randomNumLoadable.contents;
      }

      return projectInfo.stargazers_count + ' ...';
    },
});

export default function ProjectStar() {
  const [project, setProject] = useState('');
  const starCount = useRecoilValue(projectStar(project));
  const changeProject = ({ target }) => setProject(target.value);

  return (
    <div>
      Project:
      <select onChange={changeProject}>
        <option value="">Select Project</option>
        <option value="facebook/react">React</option>
        <option value="facebookexperimental/Recoil">Recoil</option>
      </select>
      <br />
      Stars: {starCount}
    </div>
  );
}
