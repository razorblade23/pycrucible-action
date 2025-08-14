# PyCrucible GitHub Action

This GitHub Action builds a standalone binary from your Python project using [PyCrucible](https://github.com/razorblade23/PyCrucible). It works cross-platform and downloads the appropriate PyCrucible binary for the runner OS.

## Usage

```yaml
- uses: razorblade23/pycrucible-action@v1
  with:
    entry: .
    output: dist/mytool
```
