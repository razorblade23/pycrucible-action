# PyCrucible GitHub Action

[![Build `TS Code` -> `Github Action`.](https://github.com/razorblade23/pycrucible-action/actions/workflows/github-action-build.yml/badge.svg)](https://github.com/razorblade23/pycrucible-action/actions/workflows/github-action-build.yml)

This GitHub Action builds a standalone binary from your Python project using [PyCrucible](https://github.com/razorblade23/PyCrucible). 

It works cross-platform and downloads the appropriate PyCrucible binary for the runner OS.

## Usage

> Linux and MacOS runners
```yaml
- uses: razorblade23/pycrucible-action@v4
  with:
    entry: .
    output: ./myapp
    # Version is optional, defaults to latest
    version: 0.3.9
```

> Windows runners
```yaml
- uses: razorblade23/pycrucible-action@v4
  with:
    entry: .
    output: .\myapp.exe
    # Version is optional, defaults to latest
    version: 0.3.9
```
