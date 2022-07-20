#!/bin/bash
ls -t output/*_all.log | head -1|xargs grep -i 'socket hang up'
ls -t output/*_all.log | head -1|xargs grep -i UnhandledPromiseRejectionWarning
ls -t output/*_all.log | head -1|xargs grep -i 'with status code'|grep -v 'with status code: 200'
ls -t output/*_all.json | head -1|xargs grep -i '"date": null'

# to not have the script return an error
true