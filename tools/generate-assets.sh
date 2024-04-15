#!/bin/zsh

root=$(dirname $(dirname ${0:a}))

export LC_ALL=C
echo "/** Generated on $(date) by 'tools/generate-assets.sh' */"
echo
echo "/* eslint-disable */"
echo "// @ts-nocheck"
echo

names=()
exports=()

echo "/** Textures */"
for file in $root/gfx/*.(png|jpg)
do
	texture=$(basename ${file})
	name=${texture%.*}
	if [[ ! -a "$root/gfx/${name}.json" ]]
	then
		echo "import ${name}_ from \"../gfx/$texture?texture\";"
		names+=(${name})
		exports+=(${name})
	fi
done

echo
echo "/** Spritesheets */"
for file in $root/gfx/*.json
do
	spritesheet=$(basename ${file%.*})
	echo "import ${spritesheet}_ from \"../gfx/$spritesheet.png?spritesheet\";"
	names+=($spritesheet)
	exports+=(${spritesheet}Sheet)
	names+=($spritesheet)
	exports+=("{ animations: { $spritesheet } }")
done

echo
echo "/** Sounds */"
for file in $root/audio/*.mp3
do
	sound=$(basename ${file%.*})
	echo "import ${sound}_ from \"../audio/$sound.mp3?sound\";"
	names+=($sound)
	exports+=(${sound})
done

echo
echo "export const ["
for export_ in $exports
do
	echo "	${export_},"
done
echo "] = await Promise.all(["
for name in $names
do
	echo "	${name}_,"
done
echo "]);"
