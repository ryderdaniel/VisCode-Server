# Python Trace

This directory contains the tools and scripts necessary to generate the custom format stack trace output.

Usage:
```bash
python3 generate_json_trace.py -f example.py -o outputname.json
```
* If `-o` is not specified, then the output will be channeled into `STDOUT`

## Interaction

In order to interact with this using STDIO streams, then first send the filesize in bytes followed by a \n, then send all the code.
