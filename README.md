# PyCrucible GitHub Action

This GitHub Action builds a standalone binary from your Python project using [PyCrucible](https://github.com/razorblade23/PyCrucible). 

It works cross-platform and downloads the appropriate PyCrucible binary for the runner OS.

## Usage

> Linux and MacOS runners
```yaml
- uses: razorblade23/pycrucible-action@v2
  with:
    entry: .
    output: ./myapp
```

> Windows runners
```yaml
- uses: razorblade23/pycrucible-action@v2
  with:
    entry: .
    output: .\myapp.exe
```
