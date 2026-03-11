#!/usr/bin/env sh

# abort on errors
set -e

# build (si tienes un paso de build para los docs, ejecútalo aquí)
# npm run docs:build

# define el directorio de origen
SOURCE_DIR="this/.me"

# navega al directorio de origen
cd $SOURCE_DIR

# inicializa un nuevo repositorio de git y fuerza el primer commit
git init
git add -A
git commit -m 'deploy'

# fuerza el push a la rama gh-pages de tu repositorio remoto
# reemplaza <TU-USUARIO> y <TU-REPOSITORIO> con tus datos
git push -f git@github.com:neurons-me/.me.git main:gh-pages

# vuelve al directorio original
cd -

# limpia el .git temporal que se creó
rm -rf "$SOURCE_dIR/.git"