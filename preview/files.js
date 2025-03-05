/** @satisfies {import('@webcontainer/api').FileSystemTree} */

export const files = {
    'example': {
        directory: {
            'index.js': {
                file: {
                    contents:
                        `
import React from 'react';
import { useTranslation } from 'react-i18next';

const WelcomeComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.description')}</p>
      <ul>
        <li>{t('welcome.feature1')}</li>
        <li>{t('welcome.feature2')}</li>
        <li>{t('welcome.feature3')}</li>
      </ul>
      <button>{t('welcome.cta')}</button>
    </div>
  );
};

export default WelcomeComponent;
`,
                },
            }
        },
    },
    'package.json': {
        file: {
            contents:
                `
{
    "name": "@shermant/i18n-translator",
    "scripts": {
        "start": "node index.js"
    },
    "dependencies": {
        "@shermant/i18n-translator": "^1.0.0"
    }
}
`,
        },
    },
};