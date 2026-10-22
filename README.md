# isworkflows

Gjenbrukbare github action workflows for Team iSyfo.

## Manual deployment to dev

`manual-deploy-dev.yml` deploys an existing image tagged with the full commit SHA,
or builds, tests and publishes it first if the tag is missing. Registry errors
other than a missing image fail the workflow rather than triggering a build.

The optional `git-commit` input selects a commit. When omitted, the latest commit
on the caller's selected branch is resolved when the workflow runs. Both the build
and the NAIS template checkout use that resolved commit.

Build steps live in `kotlin-build-image.yml` and `node-build-image-pnpm.yml`,
keeping the original individual setup, lint, test, build and publish steps.
The existing `kotlin-build-deploy.yml` and `node-build-deploy-pnpm.yml` entry
points retain their inputs and deployment behavior and reuse these build workflows.
For manual deployment, `build-image.yml` selects the appropriate build workflow.
By default, it detects Kotlin from `gradlew` or Node from `pnpm-lock.yaml`. Set
`build-type` to `kotlin` or `node` if both exist.

Example caller workflow:

```yaml
name: Manual deploy to dev
on:
  workflow_dispatch:
    inputs:
      git-commit:
        description: Commit SHA (leave empty for the latest commit on the selected branch)
        required: false
        type: string

jobs:
  deploy:
    uses: navikt/isworkflows/.github/workflows/manual-deploy-dev.yml@master
    permissions:
      contents: read
      id-token: write
      packages: read
    with:
      git-commit: ${{ inputs.git-commit }}
    secrets: inherit
```

## Node version

Node builds read `.nvmrc` from the checked-out application, including builds for
manual deployments. Keep a Node major (for example, `22`) in each app's `.nvmrc`
and use `nvm install && nvm use` locally. Updating that file updates both the CI
build version and the Docker runtime major.

The optional `node-version` input overrides `.nvmrc`. For backwards compatibility,
apps without either setting still use Node 22. The wrapper workflows forward the
input without supplying their own default.

The build workflow passes the selected Node major as the Docker build argument
`NODE_VERSION`. NAV's Node image tags track major versions, so runtime patch
versions can differ from the build version. App Dockerfiles should use:

```dockerfile
ARG NODE_VERSION
FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:${NODE_VERSION}-slim
```

For a local Docker build, after selecting Node with `nvm use` and building the app:

```sh
docker build --build-arg NODE_VERSION="$(node -p 'process.versions.node.split(".")[0]')" .
```

## Contact

### For NAV employees

We are available at the Slack channel `#isyfo`.
