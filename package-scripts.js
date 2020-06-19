/* eslint-disable @typescript-eslint/no-var-requires */
const settings = require("./.env-cmdrc");
const { apiUrlReactEnv, noLogReactEnv } = require("./src/utils/env-variables");

const distFolderName = "build";
const reactScript = "react-app-rewired";
// const reactScript = "react-scripts";

const test = `env-cmd -e test yarn ${reactScript} test --runInBand`;
const startServer = `yarn react-scripts start`;

function buildFn(flag) {
  const reactBuild = `yarn ${reactScript} build`;
  const preBuild = `rimraf ${distFolderName}/*`;

  let env;

  switch (flag) {
    case "prod":
      env = "prod";
      break;
    default:
      throw new Error("Please specify environment (e.g. 'prod') to build for!");
  }

  const envStmt = `env-cmd -e ${env}`;

  return `${preBuild} && \
    ${apiUrlReactEnv}=${settings.prod.API_URL} \
    ${noLogReactEnv}=true \
    ${envStmt} ${reactBuild}
`;
}

module.exports = {
  scripts: {
    dev: `REACT_APP_API_URL=${settings.dev.API_URL} env-cmd -e dev ${startServer}`,
    e2eDev: `REACT_APP_API_URL=${settings.e2eDev.API_URL} env-cmd -e e2eDev ${startServer}`,
    build: {
      default: buildFn("prod"),
      serve: {
        prod: `${buildFn("prod")} yarn start serve`,
      },
    },
    test: {
      default: `CI=true ${test}`,
      d: `CI=true env-cmd -e test react-scripts --inspect-brk test --runInBand --no-cache  `, // debug
      dw: `env-cmd -e test react-scripts --inspect-brk test --runInBand --no-cache`, // debug watch
      // "node --inspect node_modules/.bin/jest --runInBand"
      w: test,
      wc: `${test} --coverage`,
      c: `rimraf coverage && CI=true ${test} --coverage`,
    },
    serve: `serve -s ${distFolderName} -l ${settings.serve.port}`,
    typeCheck: {
      default: "tsc --project .",
      cypress: "tsc --project ./cypress",
    },
    lint: "eslint . --ext .js,.jsx,.ts,.tsx",
  },
};
