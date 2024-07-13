#!/bin/sh

mkdir -p dist
rm -rf dist/*
npm install @perseveranza-pets/milo
cp -r node_modules/@perseveranza-pets/milo/* dist
rm dist/*.md