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
`build-type` to `kotlin` or `node` if both exist. Node builds accept `node-version`
(default: `22`).

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

## Contact

### For NAV employees

We are available at the Slack channel `#isyfo`.
