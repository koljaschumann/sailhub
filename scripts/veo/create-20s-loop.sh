#!/bin/bash
cd "/Users/winzendwyers/Sailiing bring money money money/scripts/veo"

ffmpeg -y \
  -i tsc-header-aerialOverview-01.mp4 \
  -i tsc-header-abstractWater-01.mp4 \
  -i tsc-header-sailBillowing-01.mp4 \
  -i tsc-header-goldenHour-01.mp4 \
  -filter_complex "[0:v]trim=0:5,setpts=PTS-STARTPTS[v0]; \
                   [1:v]trim=0:5,setpts=PTS-STARTPTS[v1]; \
                   [2:v]trim=0:5,setpts=PTS-STARTPTS[v2]; \
                   [3:v]trim=0:5,setpts=PTS-STARTPTS[v3]; \
                   [0:a]atrim=0:5,asetpts=PTS-STARTPTS[a0]; \
                   [1:a]atrim=0:5,asetpts=PTS-STARTPTS[a1]; \
                   [2:a]atrim=0:5,asetpts=PTS-STARTPTS[a2]; \
                   [3:a]atrim=0:5,asetpts=PTS-STARTPTS[a3]; \
                   [v0][a0][v1][a1][v2][a2][v3][a3]concat=n=4:v=1:a=1[outv][outa]" \
  -map "[outv]" -map "[outa]" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k \
  "tsc-header-loop-20s.mp4"

echo "Done!"
ls -lh tsc-header-loop-20s.mp4
