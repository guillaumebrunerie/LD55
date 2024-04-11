#!/bin/zsh

root=$(dirname $(dirname ${0:a}))

export LC_ALL=C
echo "/** Generated on $(date) by 'tools/generate-assets.sh' */"
echo
echo "/* eslint-disable */"
echo "// @ts-nocheck"
echo

names=()

echo "/** Textures */"
for file in $root/gfx/*.png
do
	texture=$(basename ${file%.*})
	if [[ ! -a "$root/gfx/${texture}.json" ]]
	then
		echo "import ${texture}_ from \"../gfx/$texture.png?texture\";"
		names+=($texture)
	fi
done

echo
echo "/** Spritesheets */"
for file in $root/gfx/*.json
do
	spritesheet=$(basename ${file%.*})
	echo "import ${spritesheet}_ from \"../gfx/$spritesheet.png?spritesheet\";"
	names+=($spritesheet)
done

echo
echo "/** Sounds */"
for file in $root/audio/*.mp3
do
	sound=$(basename ${file%.*})
	echo "import ${sound}_ from \"../audio/$sound.mp3?sound\";"
	names+=($sound)
done

echo
echo "export const ["
for name in $names
do
	echo "	${name},"
done
echo "] = await Promise.all(["
for name in $names
do
	echo "	${name}_,"
done
echo "]);"
