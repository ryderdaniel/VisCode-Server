#!/bin/bash

openssl req -x509 -newkey rsa:4096 -sha256 -nodes -keyout server.key -out server.crt -subj "/CN=fyp.rkds.xyz" -days 365
