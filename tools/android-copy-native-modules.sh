#!/bin/bash
# Usage: ./android-copy-native-modules 4.0.0 copies native modules to abi4_0_0.host.exp.exponent

ABI_VERSION=`echo $1 | sed 's/\./_/g'`
ABI_VERSION="abi$ABI_VERSION"
VERSIONED_ABI_PATH=versioned-abis/expoview-$ABI_VERSION

pushd ../android

mkdir -p $VERSIONED_ABI_PATH/src/main/java
cp expoview/build.gradle $VERSIONED_ABI_PATH
cp expoview/src/main/AndroidManifest.xml $VERSIONED_ABI_PATH/src/main/
cp -r expoview/src/main/java/versioned $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION

# Rename references to other packages previously under versioned.host.exp.exponent
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import versioned\.host\.exp\.exponent/import $ABI_VERSION\.host\.exp\.exponent/g"
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import expo\./import $ABI_VERSION\.expo\./g"
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import static versioned\.host\.exp\.exponent/import static $ABI_VERSION\.host\.exp\.exponent/g"
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import static expo\./import static $ABI_VERSION\.expo\./g"
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/package versioned\.host\.exp\.exponent/package $ABI_VERSION\.host\.exp\.exponent/g"
# Rename references to react native
while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import $PACKAGE/import $ABI_VERSION.$PACKAGE/g"
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import static $PACKAGE/import static $ABI_VERSION.$PACKAGE/g"
done < ../tools/android-packages-to-rename.txt

popd

echo "Remember to open $VERSIONED_ABI_PATH/build.gradle and fix it."
