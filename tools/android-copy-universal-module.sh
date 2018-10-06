#!/bin/bash
# Usage: ./android-copy-universal-module 4.0.0 universal-module/.../android

ABI_VERSION=`echo $1 | sed 's/\./_/g'`
ABI_VERSION="abi$ABI_VERSION"
VERSIONED_ABI_PATH=versioned-abis/expoview-$ABI_VERSION

pushd ../android

cp -r $2/src/main/java/* $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION

# Rename references to other packages previously under versioned.host.exp.exponent
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import expo./import $ABI_VERSION\.expo\./g"
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import static expo\./import static $ABI_VERSION\.expo\./g"
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/package expo\./package $ABI_VERSION\.expo\./g"

# Rename references to react native
while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import $PACKAGE/import $ABI_VERSION.$PACKAGE/g"
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import static $PACKAGE/import static $ABI_VERSION.$PACKAGE/g"
done < ../tools/android-packages-to-rename.txt

popd
