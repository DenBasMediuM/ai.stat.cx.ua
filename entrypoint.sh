#!/bin/bash

service ssh restart
apachectl -D FOREGROUND
